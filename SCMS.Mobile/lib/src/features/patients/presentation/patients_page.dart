import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/widgets/home_widgets.dart';
import '../../../shared/widgets/scms_app_shell.dart';
import '../../auth/application/auth_controller.dart';

class PatientsPage extends ConsumerStatefulWidget {
  const PatientsPage({super.key});

  @override
  ConsumerState<PatientsPage> createState() => _PatientsPageState();
}

class _PatientsPageState extends ConsumerState<PatientsPage> {
  int _selectedProfile = 0;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final session = authState.hasValue ? authState.value : null;
    final isStaff = session?.role == 'admin' || session?.role == 'doctor';

    return ScmsAppShell(
      title: isStaff ? 'Patients & EMR' : 'Family records',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          if (isStaff)
            const _StaffPatientSearch()
          else
            _FamilyProfileSelector(
              selectedIndex: _selectedProfile,
              onSelected: (index) => setState(() => _selectedProfile = index),
            ),
          const SizedBox(height: 18),
          if (isStaff)
            const _StaffPatientWorkspace()
          else
            const _PatientRecordsWorkspace(),
        ],
      ),
    );
  }
}

class _StaffPatientSearch extends StatelessWidget {
  const _StaffPatientSearch();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          decoration: InputDecoration(
            hintText: 'Search patients, phone, or patient ID',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: IconButton(
              tooltip: 'Filter',
              onPressed: () {},
              icon: const Icon(Icons.tune),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: const [
            StatusPill(label: 'Allergies'),
            StatusPill(label: 'Follow-up due'),
            StatusPill(label: 'Lab pending'),
            StatusPill(label: 'Chronic care'),
          ],
        ),
      ],
    );
  }
}

class _FamilyProfileSelector extends StatelessWidget {
  const _FamilyProfileSelector({
    required this.selectedIndex,
    required this.onSelected,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final profiles = const [
      ('Aung Min', 'Self', Icons.account_circle_outlined),
      ('Daw Hla', 'Parent', Icons.elderly_woman_outlined),
      ('May Thu', 'Child', Icons.child_care_outlined),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Family profiles', actionLabel: 'Add'),
        SizedBox(
          height: 126,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemBuilder: (context, index) {
              final profile = profiles[index];
              final selected = selectedIndex == index;
              final colors = Theme.of(context).colorScheme;

              return SizedBox(
                width: 156,
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () => onSelected(index),
                  child: Card(
                    color: selected
                        ? colors.primaryContainer
                        : colors.surfaceContainerHighest.withValues(
                            alpha: 0.55,
                          ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: selected
                            ? colors.primary
                            : colors.outlineVariant,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            profile.$3,
                            color: selected
                                ? colors.onPrimaryContainer
                                : colors.onSurfaceVariant,
                          ),
                          const Spacer(),
                          Text(
                            profile.$1,
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 4),
                          Text(profile.$2),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
            separatorBuilder: (context, index) => const SizedBox(width: 10),
            itemCount: profiles.length,
          ),
        ),
      ],
    );
  }
}

class _StaffPatientWorkspace extends StatelessWidget {
  const _StaffPatientWorkspace();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Selected patient'),
        const FeatureCard(
          icon: Icons.person_outline,
          title: 'Aung Min - P00042',
          subtitle: 'Male, 34 - last visit May 27 - token #18',
          trailing: StatusPill(label: 'In queue'),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.1,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            MetricCard(
              icon: Icons.monitor_heart_outlined,
              label: 'BP',
              value: '124/82',
              helper: 'Last recorded',
              tint: colors.primary,
            ),
            MetricCard(
              icon: Icons.device_thermostat_outlined,
              label: 'Temp',
              value: '37.1 C',
              helper: 'Normal range',
              tint: colors.secondary,
            ),
            MetricCard(
              icon: Icons.bloodtype_outlined,
              label: 'SpO2',
              value: '98%',
              helper: 'Stable',
              tint: colors.tertiary,
            ),
            MetricCard(
              icon: Icons.scale_outlined,
              label: 'BMI',
              value: '23.8',
              helper: 'Healthy',
              tint: colors.primary,
            ),
          ],
        ),
        const SizedBox(height: 20),
        const SectionHeader(title: 'Clinical actions'),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            QuickAction(
              icon: Icons.play_circle_outline,
              label: 'Start consult',
              onPressed: () {},
            ),
            QuickAction(
              icon: Icons.medication_outlined,
              label: 'Prescribe',
              onPressed: () {},
            ),
            QuickAction(
              icon: Icons.description_outlined,
              label: 'Referral draft',
              onPressed: () {},
            ),
          ],
        ),
        const SizedBox(height: 20),
        const SectionHeader(title: 'Medical history'),
        FeatureCard(
          icon: Icons.warning_amber,
          title: 'Allergy warning',
          subtitle:
              'Penicillin allergy recorded. Show warnings while prescribing.',
          trailing: StatusPill(
            label: 'Important',
            color: colors.error,
            icon: Icons.priority_high,
          ),
        ),
        const SizedBox(height: 10),
        const FeatureCard(
          icon: Icons.timeline,
          title: 'Visit timeline',
          subtitle: 'Past visits, diagnoses, prescriptions, and lab requests.',
          trailing: Icon(Icons.chevron_right),
        ),
        const SizedBox(height: 10),
        const FeatureCard(
          icon: Icons.family_restroom,
          title: 'Family and chronic history',
          subtitle: 'Hypertension in family history. No surgeries recorded.',
          trailing: Icon(Icons.chevron_right),
        ),
      ],
    );
  }
}

class _PatientRecordsWorkspace extends StatelessWidget {
  const _PatientRecordsWorkspace();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Record summary'),
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.summarize_outlined, color: colors.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Medical summary',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const Spacer(),
                    IconButton(
                      tooltip: 'Download summary',
                      onPressed: () {},
                      icon: const Icon(Icons.download_outlined),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    StatusPill(label: 'No chronic disease'),
                    StatusPill(label: 'Penicillin allergy'),
                    StatusPill(label: 'Vaccines updated'),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 18),
        const SectionHeader(title: 'Downloads'),
        const FeatureCard(
          icon: Icons.medication_outlined,
          title: 'Prescriptions',
          subtitle: '4 PDF prescriptions available.',
          trailing: Icon(Icons.download_outlined),
        ),
        const SizedBox(height: 10),
        const FeatureCard(
          icon: Icons.receipt_long_outlined,
          title: 'Invoices',
          subtitle: '2 paid invoices and 1 pending payment approval.',
          trailing: Icon(Icons.download_outlined),
        ),
        const SizedBox(height: 10),
        const FeatureCard(
          icon: Icons.science_outlined,
          title: 'Lab reports',
          subtitle: 'Latest CBC report from May 27.',
          trailing: Icon(Icons.download_outlined),
        ),
        const SizedBox(height: 18),
        const SectionHeader(title: 'Follow-up care'),
        const FeatureCard(
          icon: Icons.event_repeat,
          title: 'Review due Jun 10',
          subtitle:
              'Doctor recommended a follow-up visit after medicine course.',
          trailing: StatusPill(label: 'Reminder'),
        ),
      ],
    );
  }
}
