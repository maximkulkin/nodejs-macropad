import usb_hid

MACROPAD_DESCRIPTOR = bytes((
    0x05, 0x0C,  # Usage Page (Consumer)
    0x09, 0x03,  # Usage (Programmable Buttons)
    0xA1, 0x04,  # Collection (Named Array)
    0x85, 0x01,  # Report ID (1)
    0x05, 0x09,  # Usage Page (Button)
    0x15, 0x00,  # Logical Minimum (0)
    0x25, 0x01,  # Logical Maximum (1)
    0x75, 0x01,  # Report Size (1)
    0x95, 0x0C,  # Report Count (12)
    0x81, 0x02,  # Input (Data,Var,Abs,Preferred State)
    0xC0,        # End Collection
))

macropad = usb_hid.Device(
    report_descriptor=MACROPAD_DESCRIPTOR,
    usage_page=0x01,
    usage=0x08,
    report_ids=(1,),
    in_report_lengths=(2,),
    out_report_lengths=(0,),
)

usb_hid.enable((macropad,))

