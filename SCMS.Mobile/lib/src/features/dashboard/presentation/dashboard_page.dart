import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/home_widgets.dart';
import '../../../shared/widgets/scms_app_shell.dart';
import '../../auth/application/auth_controller.dart';
import '../../clinic/domain/clinic_mock_data.dart';
import '../application/dashboard_controller.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.hasValue ? authState.value : null;
    final isStaff = session?.role == 'owner' || session?.role == 'doctor' || session?.role == 'admin';

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

class _ClinicDashboard extends ConsumerWidget {
  const _ClinicDashboard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    final dashboardAsync = ref.watch(doctorDashboardProvider);

    return dashboardAsync.when(
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (err, stack) => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 40),
              const SizedBox(height: 12),
              Text('Error loading dashboard: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(doctorDashboardProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (data) {
        final nextPatient = data.nextPatients.isNotEmpty ? data.nextPatients.first : null;

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
                  value: data.todayAppointmentsCount.toString(),
                  helper: 'Today',
                  tint: colors.primary,
                  onTap: () => context.go('/appointments'),
                ),
                MetricCard(
                  icon: Icons.payments_outlined,
                  label: 'Consultation fees',
                  value: '${(data.dailyRevenue / 1000).round()}k',
                  helper: 'MMK collected',
                  tint: colors.tertiary,
                  onTap: () => context.go('/appointments'),
                ),
                MetricCard(
                  icon: Icons.inventory_2_outlined,
                  label: 'Low stock',
                  value: data.lowStockAlertsCount.toString(),
                  helper: 'Needs review',
                  tint: colors.error,
                  onTap: () => context.go('/patients'),
                ),
                MetricCard(
                  icon: Icons.warning_amber,
                  label: 'Risk warnings',
                  value: data.expiringBatchesCount.toString(),
                  helper: 'Expiring batches',
                  tint: const Color(0xFFB56B00),
                  onTap: () => context.go('/patients'),
                ),
              ],
            ),
            const SizedBox(height: 22),
            if (nextPatient != null) ...[
              const SectionHeader(title: 'Next patient to call'),
              FeatureCard(
                icon: Icons.record_voice_over_outlined,
                title: 'Token ${nextPatient.tokenNumber} - ${nextPatient.patientName}',
                subtitle:
                    '${nextPatient.datetime} - ${nextPatient.notes ?? "No notes"} - ${nextPatient.appointmentCode}',
                trailing: const StatusPill(
                  label: 'Confirmed',
                ),
                onTap: () => context.go('/appointments'),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  QuickAction(
                    icon: Icons.play_circle_outline,
                    label: 'Start consultation',
                    onPressed: () => context.go('/appointments'),
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
            ],
            const SectionHeader(title: 'Appointment patient list'),
            if (data.nextPatients.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Text('No upcoming appointments for today'),
              )
            else
              for (final patient in data.nextPatients) ...[
                FeatureCard(
                  icon: Icons.confirmation_number_outlined,
                  title: '${patient.tokenNumber}. ${patient.patientName}',
                  subtitle:
                      '${patient.datetime} - ${patient.notes ?? "No notes"} - ${patient.appointmentCode}',
                  trailing: const StatusPill(
                    label: 'Confirmed',
                  ),
                  onTap: () => context.go('/appointments'),
                ),
                const SizedBox(height: 10),
              ],
            const SizedBox(height: 12),
            const SectionHeader(title: 'Risk warning list'),
            if (data.lowStockAlerts.isEmpty && data.expiringBatchesAlerts.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Text('No active stock alerts or expiring batches'),
              )
            else ...[
              for (final alert in data.lowStockAlerts) ...[
                FeatureCard(
                  icon: Icons.error_outline,
                  title: alert,
                  subtitle: 'Stock is low. Needs immediate restock.',
                  trailing: StatusPill(
                    label: 'Low stock',
                    color: colors.error,
                  ),
                  onTap: () => context.go('/patients'),
                ),
                const SizedBox(height: 10),
              ],
              for (final alert in data.expiringBatchesAlerts) ...[
                FeatureCard(
                  icon: Icons.schedule_outlined,
                  title: alert,
                  subtitle: 'Batch will expire within 30 days.',
                  trailing: const StatusPill(
                    label: 'Soon',
                    color: Color(0xFFB56B00),
                  ),
                  onTap: () => context.go('/patients'),
                ),
                const SizedBox(height: 10),
              ],
            ],
          ],
        );
      },
    );
  }
}

class _PatientDashboard extends ConsumerWidget {
  const _PatientDashboard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    final dashboardAsync = ref.watch(patientDashboardProvider);

    return dashboardAsync.when(
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (err, stack) => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 40),
              const SizedBox(height: 12),
              Text('Error loading dashboard: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(patientDashboardProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (data) {
        final upcoming = data.upcomingAppointments.isNotEmpty ? data.upcomingAppointments.first : null;
        final unpaid = data.outstandingBalances.isNotEmpty ? data.outstandingBalances.first : null;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(title: 'Care summary'),
            if (upcoming != null)
              FeatureCard(
                icon: Icons.account_circle_outlined,
                title: upcoming['patientName'] as String? ?? 'Patient',
                subtitle:
                    'Scheduled at ${upcoming['datetime']} - token #${upcoming['tokenNumber']}',
                trailing: StatusPill(
                  label: (upcoming['status'] as String? ?? 'Pending').toUpperCase(),
                  color: upcoming['status'] == 'confirmed' ? colors.primary : colors.tertiary,
                ),
                onTap: () => context.go('/appointments'),
              )
            else
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 10),
                child: Text('No upcoming appointments scheduled.'),
              ),
            const SizedBox(height: 16),
            if (upcoming != null) ...[
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
                        'Token #${upcoming['tokenNumber']}',
                        style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ProgressStrip(
                        value: 0.5,
                        label: 'Estimated appointment date: ${upcoming['datetime']}.',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 22),
            ],
            const SectionHeader(title: 'Records and payments'),
            if (unpaid != null) ...[
              FeatureCard(
                icon: Icons.receipt_long_outlined,
                title: 'Pending payment approval',
                subtitle: 'MMK ${unpaid.amount} invoice (${unpaid.paymentStatus})',
                trailing: StatusPill(label: unpaid.paymentStatus, color: colors.tertiary),
                onTap: () => context.go('/patients'),
              ),
              const SizedBox(height: 10),
            ],
            FeatureCard(
              icon: Icons.summarize_outlined,
              title: 'Medical summary',
              subtitle: 'Vitals, allergies, prescriptions, and invoices.',
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.go('/patients'),
            ),
          ],
        );
      },
    );
  }
}
