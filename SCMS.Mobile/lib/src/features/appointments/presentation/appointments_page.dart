import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/scms_app_shell.dart';
import '../application/appointments_controller.dart';

class AppointmentsPage extends ConsumerWidget {
  const AppointmentsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appointments = ref.watch(appointmentsControllerProvider);

    return ScmsAppShell(
      title: 'Appointments',
      child: AsyncValueView(
        value: appointments,
        data: (items) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemBuilder: (context, index) => ListTile(
            leading: const Icon(Icons.event_note),
            title: Text(items[index]),
          ),
          separatorBuilder: (context, index) => const Divider(height: 1),
          itemCount: items.length,
        ),
      ),
    );
  }
}
