import 'dart:developer' as developer;
import 'dart:typed_data';

Future<void> downloadFile(Uint8List bytes, String filename) async {
  developer.log('PDF download initiated on native mobile: $filename (${bytes.length} bytes)');
}
