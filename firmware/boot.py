import settings
import usb_hid

KEYS_MAX = settings.MACROPAD_MAX_KEYS_PRESSED
KEY_COUNT = settings.MACROPAD_KEY_COUNT

MACROPAD_DESCRIPTOR = bytes((
    0x05, 0x0C,       # Usage Page (Consumer)
    0x09, 0x01,       # Usage (Consumer Control)
    0xA1, 0x04,       # Collection (Application)
    0x85, 0x01,       #   Report ID (1)
    0x09, 0x03,       #   Usage (Programmable Buttons)
    0xA1, 0x04,       #   Collection (Named Array)
    0x05, 0x09,       #     Usage Page (Button)
    0x09, 0x03,       #     Usage (Button tertiary)
    0x15, 0x00,       #     Logical Minimum (0)
    0x25, KEY_COUNT,  #     Logical Maximum (KEY_COUNT)
    0x75, 0x08,       #     Report Size (8)
    0x95, KEYS_MAX,   #     Report Count (KEYS_MAX)
    0x81, 0x00,       #     Input (Data,Array)
    0xC0,             #   End Collection
    0xC0,             # End Collection

    0x05, 0x0C,       # Usage Page (Consumer)
    0x09, 0x01,       # Usage (Consumer Control)
    0xA1, 0x04,       # Collection (Application)
    0x85, 0x02,       #   Report ID (2)
    0x05, 0x08,       #   Usage Page (LED)
    0x09, 0x52,       #   Usage (RGB LED)
    0xA1, 0x02,       #   Collection (Logical)
    0x05, 0x08,       #     Usage Page (LED)
    0x09, 0x3D,       #     Usage (Indicator On)
    0x15, 0x00,       #     Logical Minimum (0)
    0x25, KEY_COUNT,  #     Logical Maximum (KEY_COUNT)
    0x75, 0x08,       #     Report Size (8)
    0x95, 0x01,       #     Report Count (1)
    0x91, 0x00,       #     Output (Data,Array)

    0x05, 0x08,       #     Usage Page (LED)
    0x09, 0x53,       #     Usage (Red LED Channel)
    0x15, 0x00,       #     Logical Minimum (0)
    0x25, 0xFF,       #     Logical Maximum (255)
    0x75, 0x08,       #     Report Size (8)
    0x95, 0x01,       #     Report Count (1)
    0x91, 0x02,       #     Output (Data,Var)

    0x05, 0x08,       #     Usage Page (LED)
    0x09, 0x55,       #     Usage (Green LED Channel)
    0x15, 0x00,       #     Logical Minimum (0)
    0x25, 0xFF,       #     Logical Maximum (255)
    0x75, 0x08,       #     Report Size (8)
    0x95, 0x01,       #     Report Count (1)
    0x91, 0x02,       #     Output (Data,Var)

    0x05, 0x08,       #     Usage Page (LED)
    0x09, 0x54,       #     Usage (Blue LED Channel)
    0x15, 0x00,       #     Logical Minimum (0)
    0x25, 0xFF,       #     Logical Maximum (255)
    0x75, 0x08,       #     Report Size (8)
    0x95, 0x01,       #     Report Count (1)
    0x91, 0x02,       #     Output (Data,Var)
    0xC0,             #   End Collection
    0xC0,             # End Collection

    0x05, 0x0C,       # Usage Page (Consumer)
    0x09, 0x01,       # Usage (Consumer Control)
    0xA1, 0x04,       # Collection (Application)
    0x85, 0x03,       #   Report ID (3)
    0x05, 0x08,       #   Usage Page (LED)
    0x09, 0x52,       #   Usage (RGB LED)
    0xA1, 0x04,       #   Collection (Named Array)
    0x05, 0x08,       #     Usage Page (LED)
    0x09, 0x41,       #     Usage (Indicator Off)
    0x15, 0x00,       #     Logical Minimum (0)
    0x25, KEY_COUNT,  #     Logical Maximum (KEY_COUNT)
    0x75, 0x08,       #     Report Size (8)
    0x95, 0x01,       #     Report Count (1)
    0x91, 0x02,       #     Output (Data,Array)
    0xC0,             #   End Collection
    0xC0,             # End Collection
))

macropad = usb_hid.Device(
    report_descriptor=MACROPAD_DESCRIPTOR,
    usage_page=0x0c,
    usage=0x01,
    report_ids=(1, 2, 3),
    in_report_lengths=(KEYS_MAX, 0, 0),
    out_report_lengths=(0, 4, 1),
)

usb_hid.enable((macropad,))

