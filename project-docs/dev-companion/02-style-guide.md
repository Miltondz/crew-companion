# 🎨 Manual de Estilo Visual (Look & Feel)

Este documento es tu guía para que la aplicación se sienta coherente. No te preocupes por los códigos de colores exactos, tu asistente de IA ya los conoce, tú solo tienes que decirle el **nombre de la situación**.

---

## 🕒 El Sistema del Tiempo (Urgencia)

Lo más importante de la app es que "reacciona" al reloj. Hay 5 situaciones posibles:

| Situación | ¿Qué está pasando? | Color Dominante | Sensación |
|-----------|--------------------|-----------------|-----------|
| **Normal** | Hay tiempo de sobra. | Azul suave / Gris | Calma y orden. |
| **Enfoque** | Quedan 30 minutos. | Amarillo suave | ¡A trabajar en serio! |
| **Urgente** | Quedan 15 minutos. | Naranja | ¡Falta poco! |
| **Pánico** | Quedan 5 minutos. | Rojo | ¡Rápido, rápido! |
| **Vencido** | Se acabó el tiempo. | Rojo Oscuro | ¡Parar todo! |

> **Tip para el asistente:** Dile: *"Usa el estilo de Modo [Situación]"* y él sabrá qué colores aplicar a los bordes y fondos.

---

## 🏷️ Etiquetas de las Tareas (Badges)

Cuando dibujes una tarea, usa estos colores para que sepamos qué tan importante es:

- **Prioridad Alta:** Texto rojo sobre fondo rosa muy clarito.
- **Prioridad Media:** Texto marrón sobre fondo amarillo clarito.
- **Prioridad Baja:** Texto verde oscuro sobre fondo verde clarito.

---

## 👤 Avatares (Los círculos de las personas)

Para mostrar quién está en el equipo:
- Usa circulitos de colores suaves (gris, azul claro).
- Dentro del círculo, pon las iniciales de la persona en mayúsculas (ej: "SD" para Sam Doe).

---

## 📏 Espacios y Formas

Queremos que la app se vea moderna y limpia. Sigue estas reglas:

1.  **Esquinas redondeadas:** No queremos puntas afiladas. Todo debe tener bordes redondeados (como un teléfono moderno).
2.  **Sombras:** Usa sombras muy suaves en las tarjetas para que parezca que están "flotando" un poco sobre el fondo.
3.  **Aire (Espaciado):** No amontones las cosas. Deja "aire" entre los textos y los bordes. Si algo se ve apretado, dile al asistente: *"Dale más espacio interno (padding)"*.

---

## 🤖 El Personaje (La Mascota)

La mascota vive en la esquina inferior derecha. Es nuestra guía emocional:

- **Si todo va bien:** Debe estar sonriendo y tranquila.
- **Si el tiempo se agota:** Debe sudar un poquito o tener los ojos más grandes.
- **Si terminamos algo:** Debe saltar de alegría con un poco de confeti.

---

## 📝 Reglas de Oro para un buen diseño:

1.  **Menos es más:** Si una pantalla tiene demasiada información, se vuelve difícil de usar. Prioriza lo importante.
2.  **Contraste:** Asegúrate de que el texto se lea bien sobre el fondo. Nunca uses texto clarito sobre fondo clarito.
3.  **Consistencia:** Si usas un tipo de borde para una tarjeta, úsalo para todas.

---

**Nota:** Milton ha preparado un kit de piezas básicas (llamado `shadcn/ui`). Si el asistente te pregunta, dile que use esas piezas siempre que pueda. Son como los ladrillos básicos de nuestra construcción.