# Release Note 0.6.18 #

## Neu

- Änderungen bei BUTTONS: Es ist möglich, die Breite und Höhe der Bilder mithilfe von imageMaxWidthPx (Standardwert: 0), imageMaxHeightPx (Standardwert: 0) und imageUseFullArea (Standardwert: false) zu ändern.
  - Die maximale Bildbreite beträgt 1000 Pixel, die maximale Bildhöhe 350 Pixel. Die maximale Höhe des gesamten Bildbereichs beträgt 400 Pixel.
  - Wenn imageUseFullArea false ist und imageMaxWidthPx sowie imageMaxHeightPx die Standardwerte (0) haben, beträgt die maximale Bildbreite 1000 Pixel und die maximale Bildhöhe 350 Pixel.
  - Wenn imageUseFullArea true ist, nimmt das Bild eine maximale Höhe von 400 px und eine maximale Breite von 1000 px ein.
  - Wenn imageUseFullArea false ist, imageMaxWidthPx den Wert 0 und imageMaxHeightPx einen Wert ungleich 0 hat, beträgt die maximale Breite 1000 px und die maximale Höhe den in imageMaxHeightPx angegebenen Wert (wenn dieser gleich oder größer als 400 px ist, wird der Wert auf 400 px begrenzt).
  - Wenn imageUseFullArea false ist, imageMaxWidthPx einen Wert ungleich 0 und imageMaxHeightPx den Wert 0 hat, entspricht die maximale Breite dem in imageMaxWidthPx angegebenen Wert (wenn dieser gleich oder größer als 1000 px ist, wird der Wert auf 1000 px begrenzt), und die maximale Höhe beträgt 350 px.
  - Wenn imageUseFullArea false ist, und sowohl imageMaxWidthPx als auch imageMaxHeightPx Werte ungleich 0 haben, entspricht die maximale Breite dem in imageMaxWidthPx angegebenen Wert (wenn dieser gleich oder größer als 1000 px ist, wird der Wert auf 1000 px begrenzt), und die maximale Höhe dem in imageMaxHeightPx angegebenen Wert (wenn dieser gleich oder größer als 400 px ist, wird der Wert auf 400 px begrenzt).
- Die End-to-End-Tests für BUTTONS wurden erweitert, um zu überprüfen, ob das Bild die korrekten max-width- und max-height-Stile annimmt, wenn imageMaxWidthPx, imageMaxHeightPx und imageUseFullArea gesetzt sind.
