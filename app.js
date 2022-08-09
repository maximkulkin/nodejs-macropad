"use strict"

import { MacroPad, ButtonEventType } from './macropad.js'

function eventName(eventType) {
    let eventName = 'single press'
    switch (eventType) {
        case ButtonEventType.SINGLE_PRESS: break
        case ButtonEventType.DOUBLE_PRESS: eventName = 'double press'; break
        case ButtonEventType.LONG_PRESS: eventName = 'long press'; break
    }
    return eventName
}

let macropad = new MacroPad()
macropad.on('button', (button, eventType) => {
    console.log('Button ' + button + ' ' + eventName(eventType))
})
macropad.start()
