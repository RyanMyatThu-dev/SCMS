import 'package:flutter/material.dart';

/// The SCMS brand logo rendered as a Flutter CustomPaint widget,
/// faithfully reproducing the dual-ribbon SVG from the WebApp's BrandLogo.jsx.
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.size = 48});

  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _BrandLogoPainter(),
    );
  }
}

class _BrandLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width / 100;

    // ── Ribbon 1: Top-Vertical curving into Left-Horizontal ──────────
    final ribbon1 = Path()
      ..moveTo(58 * s, 10 * s)
      ..lineTo(58 * s, 26 * s)
      ..cubicTo(58 * s, 43.68 * s, 43.68 * s, 58 * s, 26 * s, 58 * s)
      ..lineTo(10 * s, 58 * s)
      ..lineTo(10 * s, 42 * s)
      ..lineTo(26 * s, 42 * s)
      ..cubicTo(34.84 * s, 42 * s, 42 * s, 34.84 * s, 42 * s, 26 * s)
      ..lineTo(42 * s, 10 * s)
      ..close();

    final ribbon1Paint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
        colors: [
          Color(0xFF1D4ED8),
          Color(0xFF2563EB),
          Color(0xFFE0F2FE),
          Color(0xFF3B82F6),
          Color(0xFF2563EB),
        ],
        stops: [0.0, 0.3, 0.5, 0.7, 1.0],
      ).createShader(Rect.fromLTWH(10 * s, 10 * s, 48 * s, 48 * s));

    canvas.drawPath(ribbon1, ribbon1Paint);

    // ── Ribbon 2: Bottom-Vertical curving into Right-Horizontal ──────
    final ribbon2 = Path()
      ..moveTo(42 * s, 90 * s)
      ..lineTo(42 * s, 74 * s)
      ..cubicTo(42 * s, 56.32 * s, 56.32 * s, 42 * s, 74 * s, 42 * s)
      ..lineTo(90 * s, 42 * s)
      ..lineTo(90 * s, 58 * s)
      ..lineTo(74 * s, 58 * s)
      ..cubicTo(65.16 * s, 58 * s, 58 * s, 65.16 * s, 58 * s, 74 * s)
      ..lineTo(58 * s, 90 * s)
      ..close();

    final ribbon2Paint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.bottomLeft,
        end: Alignment.topRight,
        colors: [
          Color(0xFF1D4ED8),
          Color(0xFF2563EB),
          Color(0xFFE0F2FE),
          Color(0xFF3B82F6),
          Color(0xFF2563EB),
        ],
        stops: [0.0, 0.3, 0.5, 0.7, 1.0],
      ).createShader(Rect.fromLTWH(42 * s, 42 * s, 48 * s, 48 * s));

    canvas.drawPath(ribbon2, ribbon2Paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
