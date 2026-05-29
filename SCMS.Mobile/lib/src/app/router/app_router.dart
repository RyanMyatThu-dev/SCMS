import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/appointments/presentation/appointments_page.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/dashboard/presentation/dashboard_page.dart';
import '../../features/patients/presentation/patients_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);
  final session = authState.hasValue ? authState.value : null;
  final isSignedIn = session != null;

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final signingIn = state.matchedLocation == '/login';
      final loadingSession = authState.isLoading && !authState.hasValue;

      if (loadingSession) {
        return null;
      }

      if (!isSignedIn && !signingIn) {
        return '/login';
      }

      if (isSignedIn && signingIn) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/appointments',
        builder: (context, state) => const AppointmentsPage(),
      ),
      GoRoute(
        path: '/patients',
        builder: (context, state) => const PatientsPage(),
      ),
    ],
  );
});
