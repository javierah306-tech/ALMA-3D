# AEM 12 m · Atlas mecánico 3D

Aplicación de navegador para explorar la antena europea de ALMA y los 16 conjuntos A01–A16 del informe de la carpeta. La geometría usa **metros** y el reflector primario tiene una apertura de **12 m**. Es una reconstrucción técnica con cinemática ilustrativa; no es CAD de fabricación ni un gemelo conectado a telemetría.

## Versión 2

Cada sistema dispone de una ficha **Descripción** con qué es, para qué sirve y su rol en la antena, y otra **Cómo funciona** con el principio de operación, tres etapas, cuatro elementos constituyentes y una aclaración técnica. Los enlaces **Trabaja junto a** permiten recorrer los componentes relacionados. Las pestañas admiten navegación con teclado.

La geometría incorpora bridas anulares con chaflanes, tornillos con cabeza biselada y arandelas, sellos y casquillos, rotor separado del estator, ajustadores con rosca helicoidal y fuelle, uniones del cuadrípode, interfaces del secundario, plataformas mecanizadas y collares del hexápodo, accesos de cabina, graduaciones de encoder, abrazaderas de ductos y eslabones abiertos del cable wrap. Los materiales distinguen pintura, aluminio, acero mecanizado, cobre, elastómeros y CFRP. Los detalles de fabricación no publicados siguen siendo representativos.

Las normales analíticas del paraboloide separan el acabado de la superficie óptica del sombreado de sus paredes laterales. Esto conserva una superficie visual continua sin borrar las juntas entre los 120 paneles.

## Abrir (actualizado para GitHub)

Abre https://javierah306-tech.github.io/ALMA-3D/ directamente en el navegador. Para trabajar sin conexión, descarga el ZIP completo, descomprímelo y abre `ABRIR-ALMA-3D.html` con doble clic. No se requiere CMD ni Node.js para usarlo. `index.html` se conserva como entrada modular para alojamiento HTTP.

## Explorar

- **Exterior:** conjunto ensamblado con envolventes y paneles.
- **Interior:** envolventes transparentes para observar BUS, apoyos, accionamientos, sensores y servicios.
- **Corte:** un plano vertical fijo de la escena recorta la geometría; no genera tapas de sección.
- **Despiece:** separa los conjuntos para explicar sus relaciones; las distancias de separación no son cotas.
- La lista, las etiquetas y un clic sobre la geometría seleccionan un sistema. El inspector explica función, material, representación y evidencia, con enlace a la página del informe.
- Las pestañas **Descripción** y **Cómo funciona** explican cada sistema. Los botones de **Trabaja junto a** abren las fichas de los componentes con los que se relaciona.
- **Centrar pieza** acerca la cámara; **Aislar** muestra sólo el sistema seleccionado. `Esc` vuelve al conjunto.
- En A07, el acercamiento se dirige a un ajustador representativo para inspeccionar su vástago, rosca, fuelle, asiento y contratuerca. En A10, la cámara lateral facilita reconocer las patas entre las plataformas.
- Arrastrar para orbitar; rueda para zoom; botón derecho para desplazar. Doble clic centra una pieza. `H` restablece la cámara y `/` activa la búsqueda.
- Los controles AZ y EL mueven las jerarquías de la montura y el reflector. **Animar** ejecuta un ciclo geométrico de demostración.
- El enfoque mueve la plataforma del hexápodo y actualiza sus seis patas. La traslación se muestra **×10** para poder verla a escala de la antena. Los rangos de todos los controles son ilustrativos y no son límites operativos OEM.
- El obturador dispone de un control propio en la ficha A12. La articulación representada es conceptual.
- En **Documentación** se encuentran el informe, la fotografía, el plano oficial, las fuentes, los límites de precisión, la ficha JSON y la exportación **GLB** con jerarquías y unidades en metros.
- El botón de la esquina superior derecha guarda una imagen **PNG** de la cámara actual.

## Nivel de precisión

Datos documentados en el material suministrado: diámetro primario de 12 m; secundario de 750 mm; 120 paneles en cinco anillos; cuadrípode diagonal; accionamiento directo segmentado; rodamiento AZ de tres hileras; ocho cabezales de encoder AZ en la publicación de producción de 2007; BUS y cabina CFRP; hexápodo de seis patas.

Se reconstruyeron por proporción y función las dimensiones de montura, cabina y estructura posterior; la focal de 4,8 m; la posición axial del secundario; el reparto 12/18/24/30/36 de paneles entre anillos; el hueco central; juntas; espesores; topología de la BUS; rodillos; segmentos de motor; tornillería; interfaces; mecanismos de obturador y pasadores; ductos; cable wrap e instrumentación contextual. Se ilustra **un ajustador por panel**, sin afirmar que esa sea la cantidad real instalada.

Las roscas, ajustes, tolerancias, precargas, entrehierros, cargas, masas y deformaciones no están calculados ni validados. No se simulan electromagnetismo, control servo, dinámica estructural ni rendimiento óptico. El secundario tiene curvatura visual representativa. Las piezas C01–C04 se usan sólo como contexto; no se atribuyen configuraciones OEM confirmadas.

El informe indica expresamente que es una guía de estudio, que las ilustraciones internas son esquemas sin escala y que no dispone del catálogo completo ni de los manuales OEM. Para avanzar a un gemelo de una unidad real se necesitan CAD STEP/IGES o planos acotados y BOM de la revisión instalada, interfaces, tolerancias, límites de movimiento y un levantamiento metrológico. Para un gemelo operativo se necesitan además datos de sensores e identificación de la antena.

## Archivos

- `dist/model.js`: geometría paramétrica, conjuntos, jerarquías AZ/EL y hexápodo.
- `dist/data.js`: 16 fichas y parámetros, con datos documentados y reconstruidos.
- `dist/education.js`: descripciones, roles, principios, 48 etapas de funcionamiento y relaciones entre sistemas.
- `dist/precision.js`: detalles geométricos de acabado y construcción representativa.
- `dist/app.js`: render PBR, cámara, selección, modos, controles y exportación.
- `dist/specification.json`: registro portable de parámetros y procedencia.
- `dist/assets/`: informe original y referencias extraídas del informe.
- `dist/vendor/`: Three.js r170, OrbitControls, RoomEnvironment y GLTFExporter, bajo licencia MIT incluida.
- `qa-integration.cjs`: comprobaciones de interacción y exportación en Edge/Playwright del entorno de desarrollo; la aplicación no depende de estas herramientas.

## Referencias y créditos

Informe local `Informe_Mecanica_Antenas_ALMA.pdf`, edición de estudio de 16 de octubre de 2026: pp. 2–4, 16–25, 43–44 y 53–56.

Plano general: ESO/AEM Consortium, **antd-3300000**, 2012: https://www.eso.org/public/images/antd-3300000/

Fotografía AEM: NAOJ, reproducida como referencia educativa en el informe, p. 16: https://www.nao.ac.jp/en/telescopes/alma/

Diseño de producción: Stanghellini (2007), *The Messenger* 130, pp. 15–19: https://www.eso.org/sci/publications/messenger/archive/no.130-dec07/messenger-no130.pdf

Operación: Stanghellini et al. (2016), *Experience with the operation of the European ALMA antennas*: https://www.eso.org/sci/libraries/SPIE2016/9906-213.pdf

Esta aplicación es una elaboración independiente para exploración técnica y formación. No es una herramienta oficial de ALMA, ESO o el consorcio AEM.
