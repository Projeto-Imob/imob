/**
 * Fachada ilustrada em SVG, no estilo do protótipo aprovado (decisão 5): sem imagem externa, sem custo e sempre
 * marcada como exemplo por quem a usa. Determinística pela semente. Só atributos de apresentação do SVG:
 * nenhum style inline (a CSP não permite).
 * Janelas acesas e sol em laranja, sempre sobre o fundo preto da própria ilustração (escolha do Matheus em
 * 18/11/2026). A regra 15 só proíbe o laranja sobre fundo claro; o teste da marca libera este componente e um
 * teste de componente prova que o fundo é preto.
 */
const LARGURA = 400;
const ALTURA = 300;

/** Gerador pseudoaleatório com semente (mulberry32): a mesma semente desenha sempre o mesmo prédio. */
function sorteio(semente: number) {
  let t = semente + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FachadaIlustrada({ semente, descricao }: { semente: number; descricao: string }) {
  const r = sorteio(semente * 97 + 13);
  const solX = 60 + r() * 60;
  const solY = 50 + r() * 20;
  const torres = 2 + Math.floor(r() * 2);
  const formas: Array<{ chave: string; x: number; y: number; w: number; h: number; classe: string }> = [];
  let x = 40;
  for (let t = 0; t < torres; t++) {
    const w = 90 + Math.floor(r() * 50);
    const andares = 5 + Math.floor(r() * 5);
    const h = andares * 22 + 10;
    const y = ALTURA - 30 - h;
    formas.push({ chave: `t${t}`, x, y, w, h, classe: t % 2 ? "fill-grafite" : "fill-texto-secundario" });
    const colunas = Math.floor((w - 16) / 22);
    for (let a = 0; a < andares; a++) {
      for (let c = 0; c < colunas; c++) {
        const acesa = r() > 0.58;
        formas.push({ chave: `t${t}-${a}-${c}`, x: x + 10 + c * 22, y: y + 10 + a * 22, w: 12, h: 14, classe: acesa ? "fill-laranja" : "fill-texto-discreto" });
      }
    }
    x += w + 14 + Math.floor(r() * 16);
  }
  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={descricao} className="block h-full w-full">
      <rect width={LARGURA} height={ALTURA} className="fill-preto" />
      <circle cx={solX} cy={solY} r={14} className="fill-laranja" />
      {formas.map((f) => (
        <rect key={f.chave} x={f.x} y={f.y} width={f.w} height={f.h} className={f.classe} />
      ))}
      <rect x={0} y={ALTURA - 30} width={LARGURA} height={30} className="fill-grafite" />
    </svg>
  );
}
