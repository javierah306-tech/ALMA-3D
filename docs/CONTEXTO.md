# Contexto del proyecto

## Solicitud original

Crear un modelo 3D de la antena europea AEM de 12 m de ALMA, ejecutable desde un navegador, basado en el informe técnico suministrado. Priorizar los componentes mecánicos, la escala, los acabados y la identificación de conjuntos, con vista exterior e interior.

## Evolución acordada

1. Primera versión: 120 paneles en cinco anillos, 16 sistemas A01–A16, modos exterior, interior, corte y despiece; jerarquías AZ/EL, hexápodo, selección, aislamiento, fichas y exportación.
2. Segunda versión: conservar la interfaz aprobada, ampliar qué es cada componente, para qué sirve, su rol y funcionamiento; 48 etapas, 64 elementos y relaciones entre sistemas. Mejorar geometrías y materiales.
3. Publicación en GitHub: repositorio «ALMA 3D», conservación del contexto y funcionamiento directo en navegador sin CMD. El identificador técnico de GitHub es `ALMA-3D`.

## Fuente aportada

El informe completo está en [assets/informe.pdf](../assets/informe.pdf). La fotografía y el plano de referencia también se conservan en `assets/`, con sus créditos. El modelo se centra en las páginas 16–25 y las fichas complementarias 43–44. La documentación de la reconstrucción se conserva en [INFORME-IMPLEMENTACION.md](INFORME-IMPLEMENTACION.md).

## Decisiones de diseño

- Interfaz en español con nomenclatura inglesa, catálogo lateral, visor central, inspector y barra de cinemática.
- Three.js r170 incluido localmente, sin servicios de datos, cuentas ni telemetría de la antena.
- Una unidad geométrica equivale a un metro. Primario de 12 m y secundario de 750 mm.
- Los mecanismos se agrupan por los 16 identificadores del informe; no se inventan referencias OEM.
- Dos versiones del mismo visor: módulos para alojamiento web y HTML con JavaScript integrado para apertura local sin servidor.

## Límites de fidelidad

El informe es una guía de estudio: los esquemas internos no están acotados y no sustituyen CAD o planos OEM. Se documentan por separado los datos confirmados y los parámetros reconstruidos en [specification.json](../specification.json). No se certifican tolerancias, ajustes, roscas, precargas, entrehierros ni rendimiento óptico. La cinemática es ilustrativa y el enfoque se amplifica ×10. No hay conexión a sensores ni validación metrológica.

## Continuación

Para avanzar a un gemelo as-built se necesitan CAD STEP/IGES, planos acotados y BOM de la revisión instalada, cotas de interfaces, tolerancias, límites de movimiento y levantamiento metrológico. El código paramétrico permite sustituir las geometrías representativas por esas fuentes.

Este contexto recoge las decisiones y requisitos técnicos útiles para continuar el trabajo. No incluye credenciales ni datos privados de las herramientas de publicación.
