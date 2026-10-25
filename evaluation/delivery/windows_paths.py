"""Kernel-backed canonical paths for capability-free AppContainer, never lexical fallback."""
import os

def enable_container_paths():
    if os.name != "nt" or "NF_EVALUATION_DOS_MAP" not in os.environ:
        return False
    import ctypes
    from ctypes import wintypes
    import json
    import ntpath
    mapping = json.loads(os.environ["NF_EVALUATION_DOS_MAP"])
    drive, device = mapping["drive"], mapping["device"]
    if len(drive) != 2 or not drive[0].isalpha() or drive[1] != ":" or not device.startswith("\\Device\\"):
        raise ValueError("Invalid host-owned volume mapping")
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    create = kernel.CreateFileW
    create.argtypes = [wintypes.LPCWSTR,wintypes.DWORD,wintypes.DWORD,ctypes.c_void_p,wintypes.DWORD,wintypes.DWORD,wintypes.HANDLE]
    create.restype = wintypes.HANDLE
    final = kernel.GetFinalPathNameByHandleW
    final.argtypes = [wintypes.HANDLE,wintypes.LPWSTR,wintypes.DWORD,wintypes.DWORD]
    final.restype = wintypes.DWORD
    close = kernel.CloseHandle
    close.argtypes = [wintypes.HANDLE]
    close.restype = wintypes.BOOL
    def canonical(path):
        encoded = isinstance(path, bytes)
        spelling = os.fsdecode(path)
        handle = create(spelling,0,7,None,3,0x02000000,None)
        if handle == ctypes.c_void_p(-1).value:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            # VOLUME_NAME_NT preserves actual kernel link resolution without Mount Manager lookup.
            length = 1024
            while True:
                buffer = ctypes.create_unicode_buffer(length)
                count = final(handle,buffer,length,2)
                if not count:
                    raise ctypes.WinError(ctypes.get_last_error())
                if count < length:
                    value = buffer.value
                    break
                if count > 32768:
                    raise ValueError("Canonical path budget")
                length = count + 1
        finally:
            close(handle)
        if value.casefold() != device.casefold() and not value.casefold().startswith((device + "\\").casefold()):
            raise PermissionError("Unmapped canonical volume")
        result = "\\\\?\\" + drive + value[len(device):]
        return os.fsencode(result) if encoded else result
    ntpath._getfinalpathname = canonical
    return True
