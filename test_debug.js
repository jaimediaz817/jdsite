const content = `:::no-import:::
![Captura_1.png](./Captura_1.png)
:::final-no-import:::

![Captura_2.png](./Captura_2.png)

:::no-import:::
![Captura_3.png](./Captura_3.png)
:::final-no-import:::`;

const filename = 'Captura_1.png';

const noImportBlockRegex = /:::no-import:::\s*\n([\s\S]*?):::final-no-import:::/gm;
let resultParts = [];
let lastIdx = 0;
let match;
let matchCount = 0;
while ((match = noImportBlockRegex.exec(content)) !== null) {
    matchCount++;
    console.log(`Match ${matchCount}:`);
    console.log(`  index: ${match.index}`);
    console.log(`  match[0] (full): ${JSON.stringify(match[0].substring(0, 80))}...`);
    console.log(`  match[1] (content): ${JSON.stringify(match[1].substring(0, 80))}...`);
    console.log(`  content.includes(filename)? ${match[1].includes(filename)}`);
    console.log(`  lastIndex after exec: ${noImportBlockRegex.lastIndex}`);
    
    resultParts.push(content.substring(lastIdx, match.index));
    if (match[1].includes(filename)) {
        resultParts.push(match[1]);
    } else {
        resultParts.push(match[0]);
    }
    lastIdx = match.index + match[0].length;
}
resultParts.push(content.substring(lastIdx));

console.log(`\nMatch count: ${matchCount}`);
console.log(`Last idx after loop: ${lastIdx}`);
console.log(`\nResult:\n${resultParts.join('')}`);