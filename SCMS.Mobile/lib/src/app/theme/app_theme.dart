import 'package:flutter/material.dart';

/// Design tokens from DESIGN.md — Patient/User Theme Variants (indigo).
///
/// Light mode uses indigo primary `#4F46E5` with warm neutral surfaces.
/// Dark mode keeps the indigo identity but shifts to dark slate surfaces.
class ScmsColors {
  const ScmsColors._();

  // ── Patient/User indigo palette ──────────────────────────────────────
  static const Color primary = Color(0xFF4F46E5);
  static const Color primaryDark = Color(0xFF4338CA);
  static const Color primaryLight = Color(0xFFEEF2FF);
  static const Color primaryDeep = Color(0xFF312E81);

  // ── Semantic ─────────────────────────────────────────────────────────
  static const Color success = Color(0xFF027A48);
  static const Color successBg = Color(0xFFECFDF3);
  static const Color warning = Color(0xFFB54708);
  static const Color warningBg = Color(0xFFFFFAEB);
  static const Color danger = Color(0xFFD92D20);
  static const Color dangerBg = Color(0xFFFFF1F0);

  // ── Light neutrals ──────────────────────────────────────────────────
  static const Color bgLight = Color(0xFFF9FAFB);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color textLight = Color(0xFF1F2937);
  static const Color mutedLight = Color(0xFF6B7280);
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color surfaceLight = Color(0xFFF2F4F7);

  // ── Dark neutrals ───────────────────────────────────────────────────
  static const Color bgDark = Color(0xFF0F172A);
  static const Color cardDark = Color(0xFF1E293B);
  static const Color textDark = Color(0xFFF3F4F6);
  static const Color mutedDark = Color(0xFF9CA3AF);
  static const Color borderDark = Color(0xFF334155);
  static const Color surfaceDark = Color(0xFF1E293B);
}

class AppTheme {
  const AppTheme._();

  static ThemeData light() {
    return _base(
      ColorScheme.fromSeed(
        seedColor: ScmsColors.primary,
        brightness: Brightness.light,
        primary: ScmsColors.primary,
        onPrimary: Colors.white,
        surface: ScmsColors.bgLight,
        onSurface: ScmsColors.textLight,
        outline: ScmsColors.borderLight,
        error: ScmsColors.danger,
      ),
      Brightness.light,
    );
  }

  static ThemeData dark() {
    return _base(
      ColorScheme.fromSeed(
        seedColor: ScmsColors.primary,
        brightness: Brightness.dark,
        primary: ScmsColors.primary,
        onPrimary: Colors.white,
        surface: ScmsColors.bgDark,
        onSurface: ScmsColors.textDark,
        outline: ScmsColors.borderDark,
        error: ScmsColors.danger,
      ),
      Brightness.dark,
    );
  }

  static ThemeData _base(ColorScheme colorScheme, Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colorScheme.surface,
      appBarTheme: AppBarTheme(
        centerTitle: false,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: isDark ? ScmsColors.cardDark : ScmsColors.cardLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: isDark ? ScmsColors.borderDark : ScmsColors.borderLight,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? ScmsColors.cardDark
            : ScmsColors.cardLight,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark ? ScmsColors.borderDark : ScmsColors.borderLight,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark ? ScmsColors.borderDark : ScmsColors.borderLight,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: ScmsColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: ScmsColors.danger),
        ),
        hintStyle: TextStyle(
          color: isDark ? ScmsColors.mutedDark : ScmsColors.mutedLight,
          fontSize: 14,
        ),
        labelStyle: TextStyle(
          color: isDark ? ScmsColors.mutedDark : ScmsColors.mutedLight,
          fontSize: 13,
          fontWeight: FontWeight.w700,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: ScmsColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: isDark ? ScmsColors.textDark : ScmsColors.textLight,
          side: BorderSide(
            color: isDark ? ScmsColors.borderDark : ScmsColors.borderLight,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          minimumSize: const Size.fromHeight(48),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: ScmsColors.primary,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: isDark ? ScmsColors.borderDark : ScmsColors.borderLight,
        thickness: 1,
      ),
    );
  }
}
