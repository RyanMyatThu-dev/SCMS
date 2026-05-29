import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/widgets/home_widgets.dart';
import '../../../shared/widgets/scms_app_shell.dart';
import '../../auth/application/auth_controller.dart';

class AppointmentsPage extends ConsumerStatefulWidget {
  const AppointmentsPage({super.key});

  @override
  ConsumerState<AppointmentsPage> createState() => _AppointmentsPageState();
}

class _AppointmentsPageState extends ConsumerState<AppointmentsPage> {
  int _rangeIndex = 0;
  int _statusIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.hasValue ? authState.value : null;
    final isStaff = session?.role == 'admin' || session?.role == 'doctor';

    return ScmsAppShell(
      title: isStaff ? 'Appointments' : 'Book & queue',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          if (isStaff)
            _StaffAppointmentTools(rangeIndex: _rangeIndex)
          else
            const _PatientBookingPanel(),
          const SizedBox(height: 18),
          if (isStaff) ...[
            _SegmentedRange(
              selectedIndex: _rangeIndex,
              onChanged: (index) => setState(() => _rangeIndex = index),
              labels: const ['Day', 'Week', 'Month'],
            ),
            const SizedBox(height: 12),
            _StatusFilters(
              selectedIndex: _statusIndex,
              onChanged: (index) => setState(() => _statusIndex = index),
            ),
            const SizedBox(height: 18),
            const SectionHeader(title: 'Schedule queue'),
            const _StaffAppointmentCard(
              name: 'Aung Min',
              time: '09:30 AM',
              reason: 'Follow-up consultation',
              status: 'Confirmed',
              token: '#15',
            ),
            const _StaffAppointmentCard(
              name: 'Mya Win',
              time: '09:45 AM',
              reason: 'Fever and cough',
              status: 'Pending',
              token: '#16',
            ),
            const _StaffAppointmentCard(
              name: 'Nandar Aye',
              time: '10:10 AM',
              reason: 'Lab review',
              status: 'Reschedule',
              token: '#17',
            ),
          ] else ...[
            const SectionHeader(title: 'Live queue'),
            const _QueueCard(),
            const SizedBox(height: 18),
            const SectionHeader(title: 'Upcoming'),
            const _PatientAppointmentCard(
              doctor: 'Dr. Thandar',
              patient: 'Aung Min',
              date: 'Today, 10:20 AM',
              reason: 'General consultation',
              status: 'Confirmed',
            ),
            const _PatientAppointmentCard(
              doctor: 'Dr. Kyaw',
              patient: 'Daw Hla',
              date: 'Jun 03, 02:00 PM',
              reason: 'Follow-up review',
              status: 'Pending',
            ),
            const SizedBox(height: 18),
            const SectionHeader(title: 'History'),
            const FeatureCard(
              icon: Icons.history,
              title: 'May 14 consultation',
              subtitle: 'Completed - re-book with one tap when needed.',
              trailing: Icon(Icons.replay),
            ),
          ],
        ],
      ),
    );
  }
}

class _StaffAppointmentTools extends StatelessWidget {
  const _StaffAppointmentTools({required this.rangeIndex});

  final int rangeIndex;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const StatusPill(label: 'Today', icon: Icons.calendar_today),
                const Spacer(),
                Text(
                  rangeIndex == 0
                      ? '18 visits'
                      : rangeIndex == 1
                      ? '94 visits'
                      : '312 visits',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'Manage approvals, reschedules, completions, and the live queue.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                QuickAction(
                  icon: Icons.play_arrow,
                  label: 'Start',
                  onPressed: () {},
                ),
                QuickAction(
                  icon: Icons.event_repeat,
                  label: 'Reschedule',
                  onPressed: () {},
                ),
                QuickAction(
                  icon: Icons.skip_next,
                  label: 'Call next',
                  onPressed: () {},
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PatientBookingPanel extends StatelessWidget {
  const _PatientBookingPanel();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Card(
      color: colors.primaryContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Book an appointment',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: colors.onPrimaryContainer,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose a family member, share a brief reason, and get queue timing after confirmation.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.onPrimaryContainer.withValues(alpha: 0.78),
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.add),
                  label: const Text('New booking'),
                ),
                FilledButton.tonalIcon(
                  onPressed: () {},
                  icon: const Icon(Icons.family_restroom),
                  label: const Text('Select profile'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SegmentedRange extends StatelessWidget {
  const _SegmentedRange({
    required this.selectedIndex,
    required this.onChanged,
    required this.labels,
  });

  final int selectedIndex;
  final ValueChanged<int> onChanged;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<int>(
      segments: [
        for (var index = 0; index < labels.length; index++)
          ButtonSegment(value: index, label: Text(labels[index])),
      ],
      selected: {selectedIndex},
      onSelectionChanged: (values) => onChanged(values.first),
    );
  }
}

class _StatusFilters extends StatelessWidget {
  const _StatusFilters({required this.selectedIndex, required this.onChanged});

  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    const labels = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemBuilder: (context, index) {
          final selected = selectedIndex == index;

          return ChoiceChip(
            label: Text(labels[index]),
            selected: selected,
            onSelected: (_) => onChanged(index),
          );
        },
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemCount: labels.length,
      ),
    );
  }
}

class _StaffAppointmentCard extends StatelessWidget {
  const _StaffAppointmentCard({
    required this.name,
    required this.time,
    required this.reason,
    required this.status,
    required this.token,
  });

  final String name;
  final String time;
  final String reason;
  final String status;
  final String token;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: FeatureCard(
        icon: Icons.event_note_outlined,
        title: '$time - $name',
        subtitle: '$reason - token $token',
        trailing: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            StatusPill(
              label: status,
              color: status == 'Pending'
                  ? colors.tertiary
                  : status == 'Reschedule'
                  ? colors.error
                  : colors.primary,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 4,
              children: [
                Icon(
                  Icons.check_circle_outline,
                  size: 20,
                  color: colors.primary,
                ),
                Icon(Icons.close, size: 20, color: colors.error),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QueueCard extends StatelessWidget {
  const _QueueCard();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.confirmation_number_outlined, color: colors.primary),
                const SizedBox(width: 8),
                Text(
                  'Token #18',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                const StatusPill(label: '3rd'),
              ],
            ),
            const SizedBox(height: 12),
            const ProgressStrip(
              value: 0.64,
              label:
                  'Approx. 15 minutes. Audio alert will play when your token changes.',
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.keyboard_arrow_down),
              label: const Text('Minimize queue'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PatientAppointmentCard extends StatelessWidget {
  const _PatientAppointmentCard({
    required this.doctor,
    required this.patient,
    required this.date,
    required this.reason,
    required this.status,
  });

  final String doctor;
  final String patient;
  final String date;
  final String reason;
  final String status;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: FeatureCard(
        icon: Icons.medical_services_outlined,
        title: '$date - $doctor',
        subtitle: '$patient - $reason',
        trailing: StatusPill(label: status),
      ),
    );
  }
}
