import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/widgets/scms_app_shell.dart';
import '../../auth/application/auth_controller.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.hasValue ? authState.value : null;

    return ScmsAppShell(
      title: 'Dashboard',
      actions: [
        IconButton(
          tooltip: 'Sign out',
          onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
          icon: const Icon(Icons.logout),
        ),
      ],
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Welcome${session == null ? '' : ', ${session.email}'}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          const _DashboardTile(
            icon: Icons.event_available,
            title: 'Appointments',
            subtitle: 'Queue, visit status, and upcoming bookings.',
          ),
          const SizedBox(height: 12),
          const _DashboardTile(
            icon: Icons.medical_information,
            title: 'Care records',
            subtitle: 'Patient, doctor, and clinic workflows.',
          ),
        ],
      ),
    );
  }
}

class _DashboardTile extends StatelessWidget {
  const _DashboardTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
      ),
    );
  }
}
