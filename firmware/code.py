import board
import keypad
import neopixel
from rainbowio import colorwheel
import settings
import time
import usb_hid

KEY_COUNT = settings.MACROPAD_KEY_COUNT
MAX_KEYS_PRESSED = settings.MACROPAD_MAX_KEYS_PRESSED

keys = keypad.Keys([getattr(board, 'KEY%d' % (i+1)) for i in range(KEY_COUNT)], value_when_pressed=False, pull=True)
leds = neopixel.NeoPixel(board.NEOPIXEL, KEY_COUNT)

print('Looking for HID devices')
macropad = None
for device in usb_hid.devices:
    print('HID device: usage=', device.usage, ', usage_page=', device.usage_page)
    if device.usage_page == 0x0C and device.usage == 0x01:
        macropad = device
        break

if macropad is not None:
    print("Found macropad: ", macropad)

key_report = bytearray(MAX_KEYS_PRESSED)
pressed_keys_count = 0

def key_index(key):
    for i in range(len(key_report)):
        if key_report[i] == key:
            return i
    return -1

def process_key_events():
    global pressed_keys_count
    while True:
        key_event = keys.events.get()
        if key_event is None:
            break

        key = key_event.key_number + 1
        if key_event.pressed:
            if pressed_keys_count >= MAX_KEYS_PRESSED:
                print('Maximim number of keys pressed')
                continue

            if key_index(key) >= 0:
                continue

            key_report[pressed_keys_count] = key
            pressed_keys_count += 1
        else:
            index = key_index(key)
            if index == -1:
                continue

            if index == pressed_keys_count - 1:
                key_report[index] = 0
            else:
                key_report[index] = key_report[pressed_keys_count-1]
                key_report[pressed_keys_count-1] = 0
            pressed_keys_count -= 1

        macropad.send_report(key_report, 1)

def process_output_reports():
    while True:
        report = macropad.get_last_received_report(2)
        if report is not None:
            if report[0] == 0 or report[0] > KEY_COUNT:
                continue
            led_index = report[0] - 1
            leds[led_index] = (report[1], report[2], report[3])
            continue


        report = macropad.get_last_received_report(3)
        if report is not None:
            if report[0] == 0 or report[0] > KEY_COUNT:
                continue
            led_index = report[0] - 1
            leds[led_index] = (0, 0, 0)
            continue

        break

leds_next_update = 0
leds_colorwheel_offset = 0
def do_color_wheel():
    global leds_next_update, offset
    if time.time() >= leds_next_update:
        for i in range(0, 12):
            leds[i] = colorwheel(leds_colorwheel_offset + 21*i)
        leds_colorwheel_offset += 5
        leds_next_update = time.time() + 0.5

while True:
    process_key_events()
    process_output_reports()

