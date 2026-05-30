import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Supported locales in the application.
enum AppLocale {
  en('en', 'English'),
  mm('mm', 'မြန်မာ');

  const AppLocale(this.code, this.displayName);
  final String code;
  final String displayName;
}

/// All translatable strings for the auth and common UI, mirroring the
/// WebApp's `i18n.js` structure for consistency across platforms.
class AppStrings {
  const AppStrings._({
    required this.appName,
    required this.appSubtitle,
    required this.language,
    required this.login,
    required this.register,
    required this.logout,
    required this.email,
    required this.password,
    required this.fullName,
    required this.mobileNo,
    required this.welcome,
    required this.loginHint,
    required this.registerHint,
    required this.dashboard,
    required this.signInFailed,
    required this.registerFailed,
    required this.requiredFields,
    required this.alreadyHaveAccount,
    required this.dontHaveAccount,
    required this.orContinueWith,
    required this.creatingAccount,
    required this.signingIn,
    required this.passwordHint,
    required this.emailHint,
    required this.nameHint,
    required this.mobileHint,
  });

  final String appName;
  final String appSubtitle;
  final String language;
  final String login;
  final String register;
  final String logout;
  final String email;
  final String password;
  final String fullName;
  final String mobileNo;
  final String welcome;
  final String loginHint;
  final String registerHint;
  final String dashboard;
  final String signInFailed;
  final String registerFailed;
  final String requiredFields;
  final String alreadyHaveAccount;
  final String dontHaveAccount;
  final String orContinueWith;
  final String creatingAccount;
  final String signingIn;
  final String passwordHint;
  final String emailHint;
  final String nameHint;
  final String mobileHint;

  static const AppStrings en = AppStrings._(
    appName: 'ကုမယ်',
    appSubtitle: 'Smart Clinic Management',
    language: 'မြန်မာ',
    login: 'Sign In',
    register: 'Create Account',
    logout: 'Logout',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    mobileNo: 'Mobile Number',
    welcome: 'Welcome Back',
    loginHint: 'Sign in to continue to the ကုမယ် Patient Portal.',
    registerHint: 'Create an account for clinic access.',
    dashboard: 'Dashboard',
    signInFailed: 'Sign in failed',
    registerFailed: 'Registration failed',
    requiredFields: 'Please fill all required fields.',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    orContinueWith: 'or continue with',
    creatingAccount: 'Creating account...',
    signingIn: 'Signing in...',
    passwordHint: 'Enter your password',
    emailHint: 'you@example.com',
    nameHint: 'Enter your full name',
    mobileHint: '+95 9xxx xxx xxx',
  );

  static const AppStrings mm = AppStrings._(
    appName: 'ကုမယ်',
    appSubtitle: 'ဆေးခန်းစီမံခန့်ခွဲမှုစနစ်',
    language: 'English',
    login: 'ဝင်မည်',
    register: 'အကောင့်ဖန်တီးမည်',
    logout: 'ထွက်မည်',
    email: 'အီးမေးလ်',
    password: 'စကားဝှက်',
    fullName: 'အမည်အပြည့်အစုံ',
    mobileNo: 'ဖုန်းနံပါတ်',
    welcome: 'ပြန်လည်ကြိုဆိုပါသည်',
    loginHint: 'ကုမယ် Patient Portal သို့ ဝင်ရန် အကောင့်ဖြင့် စတင်ပါ။',
    registerHint: 'ဆေးခန်းအသုံးပြုရန် အကောင့်ဖန်တီးပါ။',
    dashboard: 'ဒက်ရှ်ဘုတ်',
    signInFailed: 'ဝင်ရောက်မှု မအောင်မြင်ပါ',
    registerFailed: 'အကောင့်ဖန်တီးမှု မအောင်မြင်ပါ',
    requiredFields: 'လိုအပ်သောအချက်အလက်များ ဖြည့်ပါ။',
    alreadyHaveAccount: 'အကောင့်ရှိပြီးသားလား?',
    dontHaveAccount: 'အကောင့်မရှိသေးဘူးလား?',
    orContinueWith: 'သို့မဟုတ်',
    creatingAccount: 'အကောင့်ဖန်တီးနေသည်...',
    signingIn: 'ဝင်ရောက်နေသည်...',
    passwordHint: 'စကားဝှက်ထည့်ပါ',
    emailHint: 'you@example.com',
    nameHint: 'အမည်ထည့်ပါ',
    mobileHint: '+၉၅ ၉xxx xxx xxx',
  );
}

/// Riverpod provider for the current locale.
final appLocaleProvider = StateProvider<AppLocale>((ref) => AppLocale.en);

/// Derived provider that returns the translated strings for the current locale.
final appStringsProvider = Provider<AppStrings>((ref) {
  final locale = ref.watch(appLocaleProvider);
  return switch (locale) {
    AppLocale.en => AppStrings.en,
    AppLocale.mm => AppStrings.mm,
  };
});
