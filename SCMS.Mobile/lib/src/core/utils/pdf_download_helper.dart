import 'dart:typed_data';

import 'pdf_download_stub.dart'
    if (dart.library.html) 'pdf_download_web.dart'
    if (dart.library.io) 'pdf_download_mobile.dart' as platform;

Future<void> saveAndLaunchFile(Uint8List bytes, String fileName) async {
  await platform.downloadFile(bytes, fileName);
}
