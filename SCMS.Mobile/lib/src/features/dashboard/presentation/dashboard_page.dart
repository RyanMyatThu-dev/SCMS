import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/home_widgets.dart';
import '../../../shared/widgets/scms_app_shell.dart';
import '../../auth/application/auth_controller.dart';
import '../../clinic/domain/clinic_mock_data.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.hasValue ? authState.value : null;
    final isStaff = session?.role == 'admin' || session?.role == 'doctor';

    return ScmsAppShell(
      title: isStaff ? 'Clinic' : 'My care',
      actions: [
        IconButton(
          tooltip: 'Sign out',
          onPressed: () => ref.read(authControllerProvider.notifier).signOut(),
          icon: const Icon(Icons.logout),
        ),
      ],
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          if (isStaff) const _ClinicDashboard() else const _PatientDashboard(),
        ],
      ),
    );
  }
}

class _ClinicDashboard extends StatelessWidget {
  const _ClinicDashboard();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final nextPatient = clinicAppointments.firstWhere(
      (appointment) => appointment.status == AppointmentStatus.confirmed,
      orElse: () => clinicAppointments.first,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Clinic summary'),
        ResponsiveCardGrid(
          childAspectRatio: 0.96,
          children: [
            MetricCard(
              icon: Icons.event_available,
              label: 'Appointments',
              value: clinicSummary.appointmentCount.toString(),
              helper: 'Today',
              tint: colors.primary,
              onTap: () => context.go('/appointments'),
            ),
            MetricCard(
              icon: Icons.payments_outlined,
              label: 'Consultation fees',
              value: '${(clinicSummary.consultationFees / 1000).round()}k',
              helper: 'MMK collected',
              tint: colors.tertiary,
              onTap: () => context.go('/appointments'),
            ),
            MetricCard(
              icon: Icons.inventory_2_outlined,
              label: 'Low stock',
              value: clinicSummary.lowStockCount.toString(),
              helper: 'Needs review',
              tint: colors.error,
              onTap: () => context.go('/patients'),
            ),
            MetricCard(
              icon: Icons.warning_amber,
              label: 'Risk warnings',
              value: clinicSummary.expiringBatchCount.toString(),
              helper: 'Expiring batches',
              tint: const Color(0xFFB56B00),
              onTap: () => context.go('/patients'),
            ),
          ],
        ),
        const SizedBox(height: 22),
        const SectionHeader(title: 'Next patient to call'),
        FeatureCard(
          icon: Icons.record_voice_over_outlined,
          title: 'Token ${nextPatient.tokenNumber} - ${nextPatient.patientName}',
          subtitle:
              '${nextPatient.timeLabel} - ${nextPatient.reason} - ${nextPatient.code}',
          trailing: StatusPill(
            label: nextPatient.status.label,
            color: nextPatient.status.color(colors),
          ),
          onTap: () => context.go('/consultation/${nextPatient.id}'),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            QuickAction(
              icon: Icons.play_circle_outline,
              label: 'Start consultation',
              onPressed: () => context.go('/consultation/${nextPatient.id}'),
            ),
            QuickAction(
              icon: Icons.skip_next,
              label: 'Call token ${nextPatient.tokenNumber}',
              onPressed: () => context.go('/appointments'),
            ),
            QuickAction(
              icon: Icons.list_alt,
              label: 'Queue list',
              onPressed: () => context.go('/appointments'),
            ),
          ],
        ),
        const SizedBox(height: 22),
        const SectionHeader(title: 'Appointment patient list'),
        for (final appointment in clinicAppointments.take(3)) ...[
          _CompactAppointmentRow(appointment: appointment),
          const SizedBox(height: 10),
        ],
        const SizedBox(height: 12),
        const SectionHeader(title: 'Risk warning list'),
        for (final alert in inventoryAlerts) ...[
          FeatureCard(
            icon: alert.isCritical
                ? Icons.error_outline
                : Icons.schedule_outlined,
            title: alert.title,
            subtitle: alert.detail,
            trailing: StatusPill(
              label: alert.isCritical ? 'Critical' : 'Soon',
              color: alert.isCritical ? colors.error : const Color(0xFFB56B00),
            ),
            onTap: () => context.go('/patients'),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _CompactAppointmentRow extends StatelessWidget {
  const _CompactAppointmentRow({required this.appointment});

  final ClinicAppointment appointment;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return FeatureCard(
      icon: Icons.confirmation_number_outlined,
      title: '${appointment.tokenNumber}. ${appointment.patientName}',
      subtitle:
          '${appointment.timeLabel} - ${appointment.reason} - ${appointment.code}',
      trailing: StatusPill(
        label: appointment.status.label,
        color: appointment.status.color(colors),
      ),
      onTap: () => context.go('/consultation/${appointment.id}'),
    );
  }
}

class _PatientDashboard extends StatelessWidget {
  const _PatientDashboard();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final appointment = clinicAppointments.first;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Care summary'),
        FeatureCard(
          icon: Icons.account_circle_outlined,
          title: appointment.patientName,
          subtitle:
              '${appointment.timeLabel} with ${appointment.doctorName} - token ${appointment.tokenNumber}',
          trailing: StatusPill(
            label: appointment.status.label,
            color: appointment.status.color(colors),
          ),
          onTap: () => context.go('/appointments'),
        ),
        const SizedBox(height: 16),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Queue position', style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                Text(
                  '3rd in queue',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 12),
                const ProgressStrip(
                  value: 0.64,
                  label: 'Approx. 15 minutes. Token 15 is being seen now.',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 22),
        const SectionHeader(title: 'Records and payments'),
        FeatureCard(
          icon: Icons.receipt_long_outlined,
          title: 'Pending payment approval',
          subtitle: 'MMK 35,000 invoice uploaded for verification.',
          trailing: StatusPill(label: 'Pending', color: colors.tertiary),
          onTap: () => context.go('/patients'),
        ),
        const SizedBox(height: 10),
        FeatureCard(
          icon: Icons.summarize_outlined,
          title: 'Medical summary',
          subtitle: 'Vitals, allergies, prescriptions, and invoices.',
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.go('/patients'),
        ),
      ],
    );
  }
}
