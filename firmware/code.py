import board
import keypad
import neopixel
from rainbowio import colorwheel
import time
import usb_hid

keys = keypad.Keys([getattr(board, 'KEY%d' % (i+1)) for i in range(0, 12)], value_when_pressed=False, pull=True)
pixels = neopixel.NeoPixel(board.NEOPIXEL, 12)

print('Looking for HID devices')
macropad = None
for device in usb_hid.devices:
    print('HID device: usage=', device.usage, ', usage_page=', device.usage_page)
    if device.usage_page == 0x01 and device.usage == 0x08:
        macropad = device
        break

if macropad is not None:
    print("Found macropad: ", macropad)
    
report = bytearray(2)

pixels_next_update = 0
offset = 0
while True:
    key_event = keys.events.get()
    if key_event:
        key = key_event.key_number
        if key_event.pressed:
            print("Key " + str(key) + " pressed")
            report[key // 8] |= (1 << (key % 8))
        else:
            print("Key " + str(key) + " released")
            report[key // 8] &= ~(1 << (key % 8))
            
        macropad.send_report(report)
    
    if time.time() >= pixels_next_update:
        for i in range(0, 12):
            pixels[i] = colorwheel(offset + 21*i)
        offset += 5
        pixels_next_update = time.time() + 0.5

