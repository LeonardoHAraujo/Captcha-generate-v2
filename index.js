import express from 'express';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

registerFont(path.join(__dirname, 'fonts/TitilliumWeb-Italic.ttf'), { family: 'TitilliumWeb-Italic' });
registerFont(path.join(__dirname, 'fonts/Roboto-Black.ttf'), { family: 'Roboto-Black' });
registerFont(path.join(__dirname, 'fonts/Montserrat-VariableFont_wght.ttf'), { family: 'Montserrat-VariableFont_wght' });

const fonts = ['TitilliumWeb-Italic', 'Roboto-Black', 'Montserrat-VariableFont_wght'];

function generateCaptcha() {
  const numbers1 = [1, 2, 4, 5, 7, 6, 9, 8, 10];
  const numbers2 = [9, 10, 12, 7, 8, 3, 1, 2, 11];
  const operators = ['+', '-', 'x'];

  const randNum1 = numbers1[Math.floor(Math.random() * numbers1.length)];
  const randNum2 = numbers2[Math.floor(Math.random() * numbers2.length)];
  const randOp = operators[Math.floor(Math.random() * operators.length)];

  const count = `${randNum1} ${randOp} ${randNum2}`;
  const result = eval(count.replace('x', '*'));

  return { count, result };
}

function drawDistortedText(context, text, x, y) {
  const chars = text.split('');
  let totalWidth = 0;
  const charWidths = chars.map(char => {
    const scaleY = 0.8 + Math.random() * 0.4; // Escala Y varia para cada letra
    const fontChoice = fonts[Math.floor(Math.random() * fonts.length)];
    context.font = `bold 40px ${fontChoice}`; // Definição da fonte para calcular a largura
    const width = context.measureText(char).width * scaleY + 2; // Largura ajustada por escala e espaçamento
    return width;
  });

  // Calcula o total da largura
  totalWidth = charWidths.reduce((acc, width) => acc + width, 0);

  // Posição inicial ajustada para centralizar
  let offsetX = x - (totalWidth / 2);

  // Desenha cada caractere com as transformações
  chars.forEach((char, i) => {
    const angle = (Math.random() - 0.5) * 0.2; // Ângulo de rotação aleatório
    const scaleY = 0.8 + Math.random() * 0.4; // Escala Y aleatória
    const fontChoice = fonts[Math.floor(Math.random() * fonts.length)];
    context.font = `bold 40px ${fontChoice}`;
    context.save();
    context.translate(offsetX, y);
    context.rotate(angle);
    context.scale(1, scaleY);
    context.fillText(char, 0, 0);
    context.restore();
    offsetX += charWidths[i]; // Incrementa offsetX pela largura calculada anteriormente
  });
}

async function processCaptcha() {
  const { count, result } = generateCaptcha();
  const backgrounds = ['bg3.png', 'bg4.png', 'bg6.png', 'bg7.png'];
  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const background = await loadImage(path.join(__dirname, 'assets', randomBg));
  const canvas = createCanvas(250, 80);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  const yPosition = (canvas.height / 2) + 15;
  drawDistortedText(ctx, count, canvas.width / 2, yPosition); // Passa a metade da largura do canvas para centralizar

  return { canvas, result };
}

app.get('/captcha', async (req, res) => {
  const { canvas, result } = await processCaptcha();
  console.log({ result });

  res.setHeader('Content-Type', 'image/png');
  canvas.createPNGStream().pipe(res);
});

app.get('/captcha/base64', async (req, res) => {
  const { canvas, result } = await processCaptcha();
  const dataUrl = canvas.toDataURL(); // Isso retorna uma string 'data:image/png;base64,iVBORw0KGgo...'
  // const base64Image = dataUrl.split(',')[1]; // Isso remove o prefixo 'data:image/png;base64,' para obter apenas a string Base64

  res.json({ img: dataUrl });
});

app.listen(port, () => {
  console.log(`CAPTCHA server running at http://localhost:${port}`);
});