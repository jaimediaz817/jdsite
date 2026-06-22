// Test de verificación de regex para toggleUploadedFile
// Simula los patrones corregidos sin depender del DOM

function test_mostrar(filename, content) {
    console.log('\n=== TEST MOSTRAR (desbloquear) ===');
    console.log('Filename:', filename);
    console.log('Content original:\n' + content + '\n---');
    
    // Procesamos cada match individualmente para evitar interferencias entre reemplazos
    const noImportBlockRegex = /:::no-import:::\s*\n([\s\S]*?):::final-no-import:::/gm;
    let resultParts = [];
    let lastIdx = 0;
    let match;
    while ((match = noImportBlockRegex.exec(content)) !== null) {
        // Agregar texto antes de este bloque
        resultParts.push(content.substring(lastIdx, match.index));
        if (match[1].includes(filename)) {
            // Este bloque contiene el archivo → devolver solo el contenido (desbloquear)
            resultParts.push(match[1]);
        } else {
            // Este bloque NO contiene el archivo → mantenerlo intacto
            resultParts.push(match[0]);
        }
        lastIdx = match.index + match[0].length;
    }
    // Agregar el resto del texto después del último match
    resultParts.push(content.substring(lastIdx));
    let updated = resultParts.join('');
    
    // Limpiar etiquetas huérfanas solo si hay desbalance
    const openCount = (updated.match(/:::no-import:::/g) || []).length;
    const closeCount = (updated.match(/:::final-no-import:::/g) || []).length;
    if (openCount !== closeCount) {
        updated = updated.replace(/^\s*:::final-no-import:::\s*$/gm, '');
        updated = updated.replace(/^\s*:::no-import:::\s*$/gm, '');
    }
    updated = updated.replace(/\n{3,}/g, '\n\n');
    
    console.log('Resultado:\n' + updated + '\n---');
    
    // Verificar que la imagen desbloqueada YA NO tiene sus etiquetas
    const noImportAroundThisFile = new RegExp(
        ':::no-import:::[\\s\\S]*?' + filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?:::final-no-import:::'
    );
    if (noImportAroundThisFile.test(updated)) {
        console.log('❌ FALLO: La imagen desbloqueada aún tiene etiquetas :::no-import:::');
    } else {
        console.log('✅ OK: La imagen desbloqueada ya no tiene etiquetas');
    }
    
    if (content !== updated) {
        console.log('✅ OK: El contenido fue modificado (se eliminaron etiquetas específicas)');
    } else {
        console.log('❌ FALLO: El contenido NO cambió');
    }
    
    // Verificar que la imagen original sigue presente (la referencia markdown)
    if (updated.includes(filename)) {
        console.log('✅ OK: La imagen markdown sigue presente');
    } else {
        console.log('❌ FALLO: La imagen markdown fue eliminada');
    }
    
    return updated;
}

function test_ocultar(filename, content) {
    console.log('\n=== TEST OCULTAR (bloquear) ===');
    console.log('Filename:', filename);
    console.log('Content original:\n' + content + '\n---');
    
    const safe = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Paso 1: Eliminar cualquier envoltura existente para evitar anidamiento
    const cleanRegex = new RegExp(
        '\\s*:::no-import:::\\s*\\n([\\s\\S]*?' + safe + '[\\s\\S]*?)\\n\\s*:::final-no-import:::\\s*',
        'gm'
    );
    let cleaned = content.replace(cleanRegex, '$1');
    
    // Paso 2: Buscar líneas de imagen
    const imgLineRegex = new RegExp(
        '(^[ \\t]*!\\[[^\\]]*\\]\\((?:\\/?|\\.\\/?)' + safe + '\\)[^\\n]*\\n?)' +
        '|(<video[^>]*src=[\'"]\\.?\\/?' + safe + '[\'"][^>]*><\\/video>\\n?)',
        'gm'
    );
    
    let match;
    let result = cleaned;
    const matches = [];
    while ((match = imgLineRegex.exec(cleaned)) !== null) {
        const alreadyWrapped = matches.some(m => 
            m.index <= match.index && m.index + m.length >= match.index + match[0].length
        );
        if (!alreadyWrapped) {
            matches.push({ index: match.index, length: match[0].length });
        }
    }
    
    // Procesar de atrás hacia adelante
    for (let i = matches.length; i--;) {
        const m = matches[i];
        const before = result.substring(0, m.index);
        const line = result.substring(m.index, m.index + m.length);
        const after = result.substring(m.index + m.length);
        
        const trimmedLine = line.replace(/\n$/, '');
        const wrapped = ':::no-import:::\n' + trimmedLine + '\n:::final-no-import:::';
        const trailingNewline = line.endsWith('\n') ? '\n' : '';
        result = before + wrapped + trailingNewline + after;
    }
    
    console.log('Resultado:\n' + result + '\n---');
    
    // Verificaciones
    const blockMatch = result.match(new RegExp(
        ':::no-import:::\n!\\[[^\\]]*\\]\\(.*?' + safe + '\\)\n:::final-no-import:::'
    ));
    if (blockMatch) {
        console.log('✅ OK: La imagen fue envuelta correctamente en :::no-import:::');
    } else {
        console.log('❌ FALLO: No se encontró la imagen envuelta');
    }
    
    return result;
}

// ===== TESTS =====

var passed = 0;
var failed = 0;

console.log('═══════════════════════════════════════');
console.log('TEST 1: Desbloquear imagen con etiquetas simples');
console.log('═══════════════════════════════════════');

var content1 = `Texto antes
:::no-import:::
![IMG_20260501_181947.jpg](./IMG_20260501_181947.jpg)
:::final-no-import:::
Texto después`;

var result1 = test_mostrar('IMG_20260501_181947.jpg', content1);

// Verificar que no quede rastro
if (!result1.includes(':::no-import:::') && !result1.includes(':::final-no-import:::') && result1.includes('![IMG_20260501_181947.jpg]')) {
    passed++;
} else {
    console.log('❌ TEST 1 FALLÓ');
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('TEST 2: Desbloquear imagen DEBE dejar intactas otras imágenes bloqueadas');
console.log('═══════════════════════════════════════');

var content2 = `:::no-import:::
![Captura_1.png](./Captura_1.png)
:::final-no-import:::

![Captura_2.png](./Captura_2.png)

:::no-import:::
![Captura_3.png](./Captura_3.png)
:::final-no-import:::`;

var result2 = test_mostrar('Captura_1.png', content2);

// Captura_1 debe estar desbloqueada
if (result2.match(/:::no-import:::\s*\n!\[Captura_1\.png\]/)) {
    console.log('❌ FALLO: Captura_1.png todavía está envuelta en no-import');
    failed++;
} else {
    console.log('✅ OK: Captura_1.png fue desbloqueada correctamente');
    passed++;
}

// Captura_3 debe seguir bloqueada
if (result2.match(/:::no-import:::\s*\n!\[Captura_3\.png\]/)) {
    console.log('✅ OK: Captura_3.png sigue bloqueada como debe ser');
    passed++;
} else {
    console.log('❌ FALLO: Captura_3.png perdió su bloqueo');
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('TEST 3: Bloquear imagen que no tiene etiquetas');
console.log('═══════════════════════════════════════');

var content3 = `Texto antes

![MiImagen.png](./MiImagen.png)

Texto después`;

var result3 = test_ocultar('MiImagen.png', content3);

if (result3.match(/:::no-import:::\s*\n!\[MiImagen\.png\]/)) {
    console.log('✅ OK: Imagen bloqueada correctamente');
    passed++;
} else {
    console.log('❌ FALLO: No se bloqueó la imagen');
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('TEST 4: Múltiples imágenes - bloquear solo una');
console.log('═══════════════════════════════════════');

var content4 = `![img1.png](./img1.png)
![img2.png](./img2.png)
![img3.png](./img3.png)`;

var result4 = test_ocultar('img2.png', content4);

// img1 y img3 NO deben estar envueltas
if (result4.match(/:::no-import:::\s*\n!\[img1\.png\]/)) {
    console.log('❌ FALLO: img1.png no debería estar bloqueada');
    failed++;
} else {
    console.log('✅ OK: img1.png no fue afectada');
    passed++;
}

if (result4.match(/:::no-import:::\s*\n!\[img3\.png\]/)) {
    console.log('❌ FALLO: img3.png no debería estar bloqueada');
    failed++;
} else {
    console.log('✅ OK: img3.png no fue afectada');
    passed++;
}

if (result4.match(/:::no-import:::\s*\n!\[img2\.png\]/)) {
    console.log('✅ OK: img2.png fue bloqueada correctamente');
    passed++;
} else {
    console.log('❌ FALLO: img2.png no fue bloqueada');
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('TEST 5: Bloquear imagen que ya estaba bloqueada (rebloquear)');
console.log('═══════════════════════════════════════');

var content5 = `:::no-import:::
![repeat.png](./repeat.png)
:::final-no-import:::
`;

var result5 = test_ocultar('repeat.png', content5);

// Solo debe haber UN bloque, no anidado
const noImportCount5 = (result5.match(/:::no-import:::/g) || []).length;
const finalCount5 = (result5.match(/:::final-no-import:::/g) || []).length;
if (noImportCount5 === 1 && finalCount5 === 1) {
    console.log('✅ OK: No hay anidamiento de etiquetas - exactamente 1 par');
    passed++;
} else {
    console.log(`❌ FALLO: Hay ${noImportCount5} aperturas y ${finalCount5} cierres (debería ser 1 y 1)`);
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('TEST 6: Imagen con ./ en la ruta');
console.log('═══════════════════════════════════════');

var content6 = `![test.png](./test.png)`;
var result6 = test_ocultar('test.png', content6);

if (result6.match(/:::no-import:::\s*\n!\[test\.png\]\(\.\/test\.png\)/)) {
    console.log('✅ OK: Imagen con ./ fue bloqueada correctamente');
    passed++;
} else {
    console.log('❌ FALLO: No se bloqueó imagen con ./');
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('TEST 7: Imagen sin ./ en la ruta');
console.log('═══════════════════════════════════════');

var content7 = `![test.png](test.png)`;
var result7 = test_ocultar('test.png', content7);

if (result7.match(/:::no-import:::\s*\n!\[test\.png\]\(test\.png\)/)) {
    console.log('✅ OK: Imagen sin ./ fue bloqueada correctamente');
    passed++;
} else {
    console.log('❌ FALLO: No se bloqueó imagen sin ./');
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('TEST 8: Video HTML');
console.log('═══════════════════════════════════════');

var content8 = `<video src="./video.mp4" controls></video>`;
var result8 = test_ocultar('video.mp4', content8);

if (result8.match(/:::no-import:::\s*\n<video/)) {
    console.log('✅ OK: Video fue bloqueado correctamente');
    passed++;
} else {
    console.log('❌ FALLO: No se bloqueó el video');
    failed++;
}

console.log('\n═══════════════════════════════════════');
console.log('RESUMEN FINAL');
console.log('═══════════════════════════════════════');
console.log(`Tests pasados: ${passed}`);
console.log(`Tests fallados: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n🎉 TODOS LOS TESTS PASARON');
} else {
    console.log(`\n❌ ${failed} test(s) fallaron`);
}