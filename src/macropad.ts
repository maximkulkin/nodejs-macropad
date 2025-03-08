'use strict'

import { EventEmitter } from 'node:events'
import * as HID from 'node-hid'
import * as Color from 'color'

const MACROPAD_VENDOR_ID = 9114
const MACROPAD_PRODUCT_ID = 33032
const MACROPAD_USAGE_PAGE = 12  // Consumer
const MACROPAD_USAGE = 1        // Consumer control

// TODO: retrieve this from device
const MACROPAD_KEY_COUNT = 12

const enum ButtonState {
    NONE,
    PRESSED,
    RELEASED,
}

export enum ButtonEventType {
    SINGLE_PRESS,
    DOUBLE_PRESS,
    LONG_PRESS,
}

class ButtonController extends EventEmitter {
  public readonly button: number
  public readonly double_press_timeout: number
  public readonly long_press_time: number

  private state: ButtonState
  private timerId

  constructor(button, double_press_timeout, long_press_time) {
    super()

    this.button = button
    this.double_press_timeout = double_press_timeout
    this.long_press_time = long_press_time

    this.state = ButtonState.NONE
    this.timerId = null
  }

  press() {
    this.process(true)
  }

  release() {
    this.process(false)
  }

  _timeout() {
    if (this.state === ButtonState.PRESSED) {
      this.emit('button', this.button, ButtonEventType.LONG_PRESS)
    } else if (this.state === ButtonState.RELEASED) {
      this.emit('button', this.button, ButtonEventType.SINGLE_PRESS)
    }
    this.state = ButtonState.NONE
    clearTimeout(this.timerId)
    this.timerId = null
  }

  finish() {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  process(pressed) {
    switch (this.state) {
      case ButtonState.NONE: {
        if (!pressed)
          return

        this.state = ButtonState.PRESSED
        this.timerId = setTimeout(this._timeout.bind(this), this.long_press_time)
        break
      }
      case ButtonState.PRESSED: {
        if (pressed)
          return

        clearTimeout(this.timerId)
        this.state = ButtonState.RELEASED
        this.timerId = setTimeout(this._timeout.bind(this), this.double_press_timeout)

        break
      }
      case ButtonState.RELEASED: {
        if (!pressed)
          return

        clearTimeout(this.timerId)
        this.state = ButtonState.NONE
        this.timerId = null
        this.emit('button', this.button, ButtonEventType.DOUBLE_PRESS)
        break
      }
    }
  }
}

export class MacroPad extends EventEmitter {
  private readonly long_press_time: number
  private readonly double_press_timeout: number

  private readonly log: typeof console.log
  private device: HID.Device
  private button_controllers: ButtonController[]
  private scanner
  private lastButtons: Set<number>

  constructor(log: typeof console.log = console.log) {
    super()

    this.long_press_time = 1000
    this.double_press_timeout = 200

    this.log = log
    this.device = null
    this.button_controllers = []
    for (let i=0; i < MACROPAD_KEY_COUNT; i++) {
      let button_controller = new ButtonController(
        i, this.double_press_timeout, this.long_press_time,
      )
      button_controller.on('button', this._buttonEvent.bind(this))

      this.button_controllers.push(button_controller)
    }
    this.scanner = null
    this.lastButtons = new Set<number>()
  }

  start() {
    if (this.scanner)
      return

    this.log('Looking for MacroPad device')
    this.scanner = setInterval(this._scan.bind(this), 1000)
  }

  stop() {
    if (!this.scanner)
      return

    clearInterval(this.scanner)
    this.scanner = null
  }

  _scan() {
    let devices = HID.devices()
    let found = false
    devices.forEach((device) => {
      if (device.vendorId !== MACROPAD_VENDOR_ID || device.productId !== MACROPAD_PRODUCT_ID ||
              device.usagePage !== MACROPAD_USAGE_PAGE || device.usage !== MACROPAD_USAGE)
        return

      found = true
      if (this.device !== null)
        return

      this.log('Found MacroPad device: ' + device.manufacturer + ' ' + device.product)
      this.device = new HID.HID(device.path)
      this.device.setNonBlocking(1)
      this.device.on('data', this._processReport.bind(this))
      this.device.on('error', (data) => {
        this.log('MacroPad error: ', data)
      })
      this.emit('connected')
    })

    if (this.device !== null && !found) {
      this.log('MacroPad detached')
      this.device.pause()
      this.device.removeAllListeners('data')
      this.device.removeAllListeners('error')
      this.device.close()
      this.device = null
      this.emit('disconnected')
      this.log('Looking for MacroPad')
    }
  }

  _buttonEvent(button, eventType) {
    this.emit('button', button, eventType)
  }

  _processReport(report) {
    if (report[0] !== 1) {
      this.log('Unknown report: ', report)
      return
    }

    const buttons = new Set<number>()
    for (let i=1; i < report.length; i++) {
      const button = report[i]
      if (button <= 0 || button > MACROPAD_KEY_COUNT)
        continue

      buttons.add(button)
      if (!this.lastButtons.has(button)) {
        this.button_controllers[button-1].press()
      }
    }
    for (const button of this.lastButtons) {
      if (!buttons.has(button)) {
        this.button_controllers[button-1].release()
      }
    }
    this.lastButtons = buttons
  }

  setLight(index: number, color: Color) {
    var report = Buffer.alloc(5)
    report[0] = 2
    report[1] = index + 1
    report[2] = color.red()
    report[3] = color.green()
    report[4] = color.blue()
    this.device.sendFeatureReport(report)
  }

  setLightOff(index: number) {
    var report = Buffer.alloc(2)
    report[0] = 3
    report[1] = index + 1
    this.device.sendFeatureReport(report)
  }
}
