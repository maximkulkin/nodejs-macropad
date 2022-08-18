"use strict"

const mp = require('./dist/macropad.js')
const Color = require('color')

function eventName(eventType) {
    let eventName = 'single press'
    switch (eventType) {
        case mp.ButtonEventType.SINGLE_PRESS: break
        case mp.ButtonEventType.DOUBLE_PRESS: eventName = 'double press'; break
        case mp.ButtonEventType.LONG_PRESS: eventName = 'long press'; break
    }
    return eventName
}

let macropad = new mp.MacroPad()
macropad.on('button', (button, eventType) => {
    console.log('Button ' + button + ' ' + eventName(eventType))
})

let lightIndex = 11
let lightTimer = null
function lightAllOff() {
    for (let i=0; i < 12; i++) {
        macropad.setLightOff(i)
    }
}
function lightUpdate() {
    macropad.setLightOff(lightIndex)
    lightIndex = (lightIndex + 1) % 12
    macropad.setLight(lightIndex, Color.rgb(255, 0, 0))
}

macropad.on('connected', () => {
  lightAllOff()
  lightTimer = setInterval(lightUpdate, 200)
})
macropad.on('disconnected', () => {
  if (lightTimer == null)
    return

  clearInterval(lightTimer)
  lightTimer = null
})

macropad.start()
