import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/scms_app_shell.dart';
import '../application/patients_controller.dart';

class PatientsPage extends ConsumerWidget {
  const PatientsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final patients = ref.watch(patientsControllerProvider);

    return ScmsAppShell(
      title: 'Patients',
      child: AsyncValueView(
        value: patients,
        data: (items) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemBuilder: (context, index) => ListTile(
            leading: const Icon(Icons.person_outline),
            title: Text(items[index]),
          ),
          separatorBuilder: (context, index) => const Divider(height: 1),
          itemCount: items.length,
        ),
      ),
    );
  }
}
