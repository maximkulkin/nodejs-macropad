"use strict"

import { Timeout } from 'node'
import { EventEmitter } from 'node:events'
import * as HID from 'node-hid'

const MACROPAD_VENDOR_ID = 9114
const MACROPAD_PRODUCT_ID = 33032
const MACROPAD_USAGE_PAGE = 12
const MACROPAD_USAGE = 3

// TODO: retrieve this from device
const MACROPAD_KEY_COUNT = 12

enum ButtonState {
    NONE,
    PRESSED,
    RELEASED,
}

enum ButtonEventType {
    SINGLE_PRESS,
    DOUBLE_PRESS,
    LONG_PRESS,
}

class ButtonController extends EventEmitter {
    public readonly button: number
    public readonly double_press_timeout: number
    public readonly long_press_time: number

    private state: ButtonState
    private timerId: Timeout | null

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
        if (this.state == ButtonState.PRESSED) {
            this.emit('button', this.button, ButtonEventType.LONG_PRESS)
        } else if (this.state == ButtonState.RELEASED) {
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
                this.timerId = null
                this.emit('button', this.button, ButtonEventType.DOUBLE_PRESS)
                break
            }
        }
    }
}

class MacroPad extends EventEmitter {
    private readonly long_press_time: number
    private readonly double_press_timeout: number

    private readonly log: typeof console.log
    private device: HID.Device
    private controller: ButtonController | null
    private scanner: Timeout | null

    constructor(log: typeof console.log = console.log) {
        super()

        this.long_press_time = 1000
        this.double_press_timeout = 200

        this.log = log
        this.device = null
        this.controller = null
        this.scanner = null
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
            if (device.vendorId != MACROPAD_VENDOR_ID || device.productId != MACROPAD_PRODUCT_ID ||
                    device.usagePage != MACROPAD_USAGE_PAGE || device.usage != MACROPAD_USAGE)
                return

            found = true
            if (this.device != null)
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

        if (this.device != null && !found) {
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
        if (this.controller) {
            this.controller.finish()
            this.controller = null
        }
    }

    _processReport(report) {
        if (report[0] != 1) {
            this.log("Unknown report: ", report[0])
            return
        }

        // this.logger.debug("Got report: ", report.subarray(1))

        let buttons = (report[2] << 8) + report[1]
        if (this.controller) {
            if (buttons & (1 << this.controller.button)) {
                this.controller.press()
            } else {
                this.controller.release()
            }
        } else {
            for (let i=0; i < MACROPAD_KEY_COUNT; i++) {
                if ((buttons & (1 << i)) == 0)
                    continue

                this.controller = new ButtonController(
                    i, this.double_press_timeout, this.long_press_time,
                )
                this.controller.on('button', this._buttonEvent.bind(this))
                this.controller.press()
                break
            }
        }
    }
}

export { MacroPad, ButtonEventType }
