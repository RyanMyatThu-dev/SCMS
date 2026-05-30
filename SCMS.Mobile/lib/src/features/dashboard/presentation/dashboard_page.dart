import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/utils/pdf_download_helper.dart';
import '../../../shared/widgets/home_widgets.dart';
import '../../../shared/widgets/scms_app_shell.dart';
import '../../appointments/data/appointments_repository.dart';
import '../../appointments/domain/appointment_models.dart';
import '../../auth/application/auth_controller.dart';
import '../../patients/domain/patient_models.dart';
import '../application/dashboard_controller.dart';
import '../data/dashboard_repository.dart';
import '../domain/dashboard_models.dart';

// StateProvider to track the selected patient profile for family switching
final activePatientProfileIdProvider = StateProvider.autoDispose<int?>((ref) => null);

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.hasValue ? authState.value : null;
    final isStaff = session?.role == 'owner' || session?.role == 'doctor' || session?.role == 'admin';

    return ScmsAppShell(
      title: isStaff ? 'Clinic' : 'My Care Portal',
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

  Color _getStatusColor(String status) {
    final s = status.toLowerCase();
    if (s == 'completed' || s == 'paid' || s == 'success') {
      return Colors.emerald;
    }
    if (s == 'approved' || s == 'confirmed' || s == 'active') {
      return Colors.indigo;
    }
    if (s == 'cancelled' || s == 'failed' || s == 'rejected') {
      return Colors.red;
    }
    if (s == 'pending' || s == 'requested') {
      return Colors.orange;
    }
    return Colors.grey;
  }

  String _formatDateString(DateTime date) {
    return DateFormat('dd-MM-yyyy HH:mm').format(date);
  }

  String _formatJustDate(DateTime date) {
    return DateFormat('dd-MM-yyyy').format(date);
  }

  Future<void> _downloadPrescription(BuildContext context, WidgetRef ref, int rxId) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Downloading prescription...'), duration: Duration(seconds: 1)),
      );
      final repo = ref.read(dashboardRepositoryProvider);
      final bytes = await repo.downloadPrescriptionPdf(rxId);
      await saveAndLaunchFile(bytes, 'prescription-$rxId.pdf');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Prescription downloaded successfully!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    }
  }

  Future<void> _downloadInvoice(BuildContext context, WidgetRef ref, int paymentId) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Downloading invoice...'), duration: Duration(seconds: 1)),
      );
      final repo = ref.read(dashboardRepositoryProvider);
      final bytes = await repo.downloadInvoicePdf(paymentId);
      await saveAndLaunchFile(bytes, 'invoice-$paymentId.pdf');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invoice downloaded successfully!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    final dashboardAsync = ref.watch(patientDashboardProvider);

    return dashboardAsync.when(
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 80),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (err, stack) => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Column(
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text('Error loading dashboard: $err', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.invalidate(patientDashboardProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (data) {
        if (data.patientProfiles.isEmpty) {
          return Center(
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              elevation: 0,
              color: colors.surfaceContainerLowest,
              margin: const EdgeInsets.symmetric(vertical: 40),
              child: const Padding(
                padding: EdgeInsets.all(28.0),
                child: Column(
                  children: [
                    Icon(Icons.info_outline, color: Colors.indigo, size: 54),
                    SizedBox(height: 16),
                    Text(
                      'No Patient Profiles Linked',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Please contact clinic staff to link your registered patients with this account.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        // Active family profile switching logic
        final selectedId = ref.watch(activePatientProfileIdProvider);
        final activeProfile = data.patientProfiles.firstWhere(
          (p) => p.patientId == selectedId,
          orElse: () => data.patientProfiles.first,
        );

        // Filter clinical data based on active patient profile
        final filteredAppointments = data.upcomingAppointments.where((a) => a.patientId == activeProfile.patientId).toList();
        final filteredPrescriptions = data.prescriptionHistory.where((p) => p.patientId == activeProfile.patientId).toList();
        final filteredOutstanding = data.outstandingBalances.where(
          (b) => data.upcomingAppointments.any((a) => a.id == b.appointmentId && a.patientId == activeProfile.patientId),
        ).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Horizonally scrollable Family Switcher chips
            const SectionHeader(title: 'Select family patient profile'),
            const SizedBox(height: 8),
            SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: data.patientProfiles.length,
                itemBuilder: (context, index) {
                  final profile = data.patientProfiles[index];
                  final isSelected = profile.patientId == activeProfile.patientId;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(
                        '${profile.name} (${profile.bloodType ?? "O+"})',
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black87,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: Colors.indigo,
                      backgroundColor: Colors.white,
                      side: BorderSide(
                        color: isSelected ? Colors.indigo : Colors.grey.shade300,
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      onSelected: (selected) {
                        if (selected) {
                          ref.read(activePatientProfileIdProvider.notifier).state = profile.patientId;
                        }
                      },
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 18),

            // Premium Patient Card with elegant gradients
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF6366F1), Color(0xFF7C3AED)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.indigo.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  )
                ],
              ),
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        height: 58,
                        width: 58,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          activeProfile.name.isNotEmpty
                              ? activeProfile.name.split(' ').map((n) => n[0]).take(2).join('').toUpperCase()
                              : 'PT',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              activeProfile.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 21,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (activeProfile.bloodType != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade400.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(99),
                                  border: Border.all(color: Colors.red.shade200.withOpacity(0.4)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.opacity, color: Color(0xFFF43F5E), size: 12),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Blood Type: ${activeProfile.bloodType}',
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Divider(color: Colors.white24, height: 1),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.phone_outlined, color: Colors.white70, size: 16),
                      const SizedBox(width: 8),
                      Text(activeProfile.mobileNo ?? 'No Mobile Number', style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      const Icon(Icons.person_outline, color: Colors.white70, size: 16),
                      const SizedBox(width: 8),
                      Text(activeProfile.gender ?? 'Not Specified', style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  if (activeProfile.actualAddress != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.map_outlined, color: Colors.white70, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            activeProfile.actualAddress!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.indigo.shade800,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                      ),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) => _BookAppointmentDialog(
                            activeProfile: activeProfile,
                          ),
                        );
                      },
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Book Appointment', style: TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Upcoming Visits
            SectionHeader(
              title: 'Upcoming Visits',
              actionLabel: '${filteredAppointments.length} Active',
            ),
            const SizedBox(height: 8),
            if (filteredAppointments.isEmpty)
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                elevation: 0,
                color: colors.surfaceContainerLowest,
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
                  child: Center(
                    child: Text('No upcoming visits scheduled.', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                  ),
                ),
              )
            else
              ...filteredAppointments.map((appt) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(color: colors.outlineVariant),
                  ),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Code: #${appt.appointmentCode}',
                              style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.indigo, fontSize: 13),
                            ),
                            const Spacer(),
                            StatusPill(
                              label: appt.status.toUpperCase(),
                              color: _getStatusColor(appt.status),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey),
                            const SizedBox(width: 8),
                            Text(
                              _formatDateString(appt.datetime),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        if (appt.tokenNumber > 0) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.confirmation_number_outlined, size: 14, color: Colors.indigo),
                              const SizedBox(width: 8),
                              Text(
                                'Token Number: #${appt.tokenNumber}',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                            ],
                          ),
                        ],
                        if (appt.notes != null && appt.notes!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.indigo.shade50.withOpacity(0.4),
                              borderRadius: BorderRadius.circular(12),
                              border: Border(left: BorderSide(color: Colors.indigo.shade300, width: 3)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('“ ', style: TextStyle(color: Colors.indigo, fontSize: 18, fontWeight: FontWeight.bold)),
                                Expanded(
                                  child: Text(
                                    appt.notes!,
                                    style: TextStyle(
                                      color: Colors.grey.shade700,
                                      fontStyle: FontStyle.italic,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            const SizedBox(height: 18),

            // Outstanding Invoices
            SectionHeader(
              title: 'Outstanding Invoices',
              actionLabel: '${filteredOutstanding.length} Unpaid',
            ),
            const SizedBox(height: 8),
            if (filteredOutstanding.isEmpty)
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                elevation: 0,
                color: colors.surfaceContainerLowest,
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
                  child: Center(
                    child: Text('All balances are clear! Thank you.', style: TextStyle(color: Colors.emerald, fontWeight: FontWeight.w900)),
                  ),
                ),
              )
            else
              ...filteredOutstanding.map((invoice) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(color: colors.outlineVariant),
                  ),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Visit: #${invoice.appointmentCode}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
                            ),
                            const Spacer(),
                            StatusPill(
                              label: invoice.paymentStatus.toUpperCase(),
                              color: _getStatusColor(invoice.paymentStatus),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${NumberFormat.decimalPattern().format(invoice.amount)} MMK',
                                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.indigo),
                                ),
                                if (invoice.tax > 0)
                                  const Text(
                                    'Includes tax & charges',
                                    style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                              ],
                            ),
                            const Spacer(),
                            Row(
                              children: [
                                IconButton(
                                  style: IconButton.styleFrom(
                                    backgroundColor: Colors.grey.shade50,
                                    side: BorderSide(color: Colors.grey.shade200),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: () => _downloadInvoice(context, ref, invoice.id),
                                  icon: const Icon(Icons.download, size: 18),
                                  tooltip: 'Download Invoice PDF',
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.indigo,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (context) => _SubmitPaymentProofDialog(
                                        invoice: invoice,
                                      ),
                                    );
                                  },
                                  child: const Text('Pay Now', style: TextStyle(fontWeight: FontWeight.w800)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
            const SizedBox(height: 18),

            // Prescription Records
            SectionHeader(
              title: 'Prescriptions & History',
              actionLabel: '${filteredPrescriptions.length} Records',
            ),
            const SizedBox(height: 8),
            if (filteredPrescriptions.isEmpty)
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                elevation: 0,
                color: colors.surfaceContainerLowest,
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
                  child: Center(
                    child: Text('No prescription records found.', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                  ),
                ),
              )
            else
              ...filteredPrescriptions.map((rx) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(22),
                    side: BorderSide(color: Colors.grey.shade200),
                  ),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Visit: #${rx.appointmentCode}',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _formatJustDate(rx.createdAt),
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                                ),
                              ],
                            ),
                            const Spacer(),
                            IconButton.filled(
                              style: IconButton.styleFrom(
                                backgroundColor: Colors.indigo.shade50,
                                foregroundColor: Colors.indigo,
                              ),
                              onPressed: () => _downloadPrescription(context, ref, rx.id),
                              icon: const Icon(Icons.download, size: 18),
                              tooltip: 'Download PDF',
                            ),
                          ],
                        ),
                        if (rx.diseaseName != null && rx.diseaseName!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.favorite, color: Color(0xFFF43F5E), size: 14),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.red.shade100),
                                ),
                                child: Text(
                                  rx.diseaseName!,
                                  style: TextStyle(
                                    color: Colors.red.shade800,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],

                        // EMR Stats in a modern structured Grid
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade100),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              if (rx.weightKg > 0)
                                Column(
                                  children: [
                                    const Text('WEIGHT', style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.w900)),
                                    const SizedBox(height: 4),
                                    Text('${rx.weightKg} kg', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ],
                                ),
                              if (rx.bloodPressureSystolic > 0)
                                Column(
                                  children: [
                                    const Text('BP', style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.w900)),
                                    const SizedBox(height: 4),
                                    Text('${rx.bloodPressureSystolic}/${rx.bloodPressureDiastolic}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ],
                                ),
                              if (rx.temperatureC != null && rx.temperatureC! > 0)
                                Column(
                                  children: [
                                    const Text('TEMP', style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.w900)),
                                    const SizedBox(height: 4),
                                    Text('${(rx.temperatureC! * 9 / 5 + 32).toStringAsFixed(1)} °F', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ],
                                ),
                            ],
                          ),
                        ),

                        // Prescribed Medicines list
                        if (rx.items.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          const Text(
                            'PRESCRIBED MEDICINES',
                            style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 8),
                          ...rx.items.map((item) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('💊 ', style: TextStyle(fontSize: 12)),
                                  Expanded(
                                    child: RichText(
                                      text: TextSpan(
                                        style: const TextStyle(color: Colors.black87, fontSize: 13),
                                        children: [
                                          TextSpan(
                                            text: '${item.medicineName} ',
                                            style: const TextStyle(fontWeight: FontWeight.bold),
                                          ),
                                          TextSpan(
                                            text: '(${item.dosage} × ${item.days} days) - ',
                                            style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w600),
                                          ),
                                          TextSpan(
                                            text: item.instruction,
                                            style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.indigo, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],

                        if (rx.notes != null && rx.notes!.isNotEmpty) ...[
                          const SizedBox(height: 14),
                          const Divider(height: 1),
                          const SizedBox(height: 12),
                          Text(
                            '“${rx.notes}”',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontStyle: FontStyle.italic,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
          ],
        );
      },
    );
  }
}

// Dialog widget to book an appointment
class _BookAppointmentDialog extends ConsumerStatefulWidget {
  const _BookAppointmentDialog({required this.activeProfile});

  final PatientProfileResponse activeProfile;

  @override
  ConsumerState<_BookAppointmentDialog> createState() => _BookAppointmentDialogState();
}

class _BookAppointmentDialogState extends ConsumerState<_BookAppointmentDialog> {
  DateTime? _selectedDateTime;
  final _notesController = TextEditingController();
  bool _submitting = false;

  Future<void> _pickDateTime() async {
    final now = DateTime.now();
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 60)),
    );

    if (pickedDate != null && mounted) {
      final pickedTime = await showTimePicker(
        context: context,
        initialTime: const TimeOfDay(hour: 9, minute: 0),
      );

      if (pickedTime != null && mounted) {
        setState(() {
          _selectedDateTime = DateTime(
            pickedDate.year,
            pickedDate.month,
            pickedDate.day,
            pickedTime.hour,
            pickedTime.minute,
          );
        });
      }
    }
  }

  Future<void> _submitBooking() async {
    if (_selectedDateTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please pick a preferred date and time.')),
      );
      return;
    }

    try {
      setState(() => _submitting = true);

      final req = BookAppointmentRequest(
        patientId: widget.activeProfile.patientId,
        datetime: _selectedDateTime!,
        notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      );

      final repo = ref.read(appointmentsRepositoryProvider);
      await repo.bookAppointment(req);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment booked successfully!')),
        );
        ref.invalidate(patientDashboardProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Booking failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.auto_awesome, color: Colors.indigo),
                  SizedBox(width: 8),
                  Text(
                    'Book Clinic Visit',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Schedule a clinic consultation for ${widget.activeProfile.name}.',
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 20),

              // Date Time Picker Button
              const Text('PREFERRED DATE & TIME', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              InkWell(
                onTap: _submitting ? null : _pickDateTime,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_month, color: _selectedDateTime != null ? Colors.indigo : Colors.grey),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _selectedDateTime != null
                              ? DateFormat('dd-MM-yyyy @ hh:mm a').format(_selectedDateTime!)
                              : 'Select preferred Date & Time',
                          style: TextStyle(
                            fontSize: 13,
                            color: _selectedDateTime != null ? Colors.black87 : Colors.grey,
                            fontWeight: _selectedDateTime != null ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                      const Icon(Icons.arrow_drop_down, color: Colors.grey),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Symptoms input
              const Text('SYMPTOMS / NOTES (OPTIONAL)', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              TextField(
                controller: _notesController,
                maxLines: 3,
                enabled: !_submitting,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Describe your symptoms (e.g. Fever for two days, cough, joint pain...)',
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Colors.indigo),
                  ),
                ),
              ),
              const SizedBox(height: 22),

              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _submitting ? null : () => Navigator.pop(context),
                    child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    height: 44,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _submitting ? null : _submitBooking,
                      child: _submitting
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Confirm Booking', style: TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Dialog widget to submit manual payment proof
class _SubmitPaymentProofDialog extends ConsumerStatefulWidget {
  const _SubmitPaymentProofDialog({required this.invoice});

  final UnpaidInvoiceDto invoice;

  @override
  ConsumerState<_SubmitPaymentProofDialog> createState() => _SubmitPaymentProofDialogState();
}

class _SubmitPaymentProofDialogState extends ConsumerState<_SubmitPaymentProofDialog> {
  String _selectedMethod = 'kbzpay';
  final _screenshotController = TextEditingController();
  bool _submitting = false;

  final List<Map<String, String>> _gateways = const [
    {'value': 'kbzpay', 'label': 'KBZPay'},
    {'value': 'wavepay', 'label': 'WavePay'},
    {'value': 'cbpay', 'label': 'CBPay'},
    {'value': 'ayapay', 'label': 'AYAPay'},
  ];

  Future<void> _submitProof() async {
    final url = _screenshotController.text.trim();
    if (url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide a hosted screenshot link.')),
      );
      return;
    }

    try {
      setState(() => _submitting = true);

      final repo = ref.read(dashboardRepositoryProvider);
      await repo.submitPaymentProof(
        appointmentId: widget.invoice.appointmentId,
        paymentMethod: _selectedMethod,
        amount: widget.invoice.amount,
        screenshotUrl: url,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment proof submitted successfully! Review pending by staff.')),
        );
        ref.invalidate(patientDashboardProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  void dispose() {
    _screenshotController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.credit_card, color: Colors.indigo),
                  SizedBox(width: 8),
                  Text(
                    'Submit Payment Proof',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Invoice Details Banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.indigo.shade100),
                ),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('PAYMENT AMOUNT', style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.w900)),
                        const SizedBox(height: 4),
                        Text(
                          '${NumberFormat.decimalPattern().format(widget.invoice.amount)} MMK',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.indigo),
                        ),
                        const SizedBox(height: 4),
                        Text('For Appointment Code: #${widget.invoice.appointmentCode}', style: const TextStyle(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Payment Gateway Selector
              const Text('PAYMENT WALLET / METHOD', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedMethod,
                    isExpanded: true,
                    items: _gateways.map((g) {
                      return DropdownMenuItem<String>(
                        value: g['value'],
                        child: Text(g['label']!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      );
                    }).toList(),
                    onChanged: _submitting
                        ? null
                        : (val) {
                            if (val != null) {
                              setState(() => _selectedMethod = val);
                            }
                          },
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Screenshot URL Input
              const Text('SCREENSHOT / RECEIPT IMAGE URL', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              TextField(
                controller: _screenshotController,
                enabled: !_submitting,
                keyboardType: TextInputType.url,
                style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  hintText: 'https://imgur.com/example.jpg',
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: Colors.grey.shade200),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Colors.indigo),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Provide a valid hosted image link (e.g. imgur, postimg).',
                style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),

              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _submitting ? null : () => Navigator.pop(context),
                    child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    height: 44,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _submitting ? null : _submitProof,
                      child: _submitting
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Submit Proof', style: TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
