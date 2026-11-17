/**
 * Escolha de 2 a 3 opções (tarefa 2.8). Só entram notas ≥ mínimo (50, Proposta); vão as 2 melhores
 * e a terceira só se estiver a até a janela (15 pontos, Proposta) da primeira. Sem opção acima do
 * mínimo, o resultado diz isso em vez de forçar uma indicação.
 */
import { scoringConfig, type ScoringConfig } from "@config/scoring.config";
import { compararAvaliacoes, type Avaliacao } from "./nota";

export type Escolha = { opcoes: Avaliacao[]; nenhumaAcimaDoMinimo: boolean };

export function escolher(avaliacoes: Avaliacao[], cfg: ScoringConfig = scoringConfig): Escolha {
  const { notaMinima, janelaTerceiraOpcao } = cfg.proposta;
  const aptas = avaliacoes
    .filter((a): a is Avaliacao & { nota: number } => a.nota !== null && a.nota >= notaMinima)
    .sort(compararAvaliacoes);
  if (aptas.length === 0) return { opcoes: [], nenhumaAcimaDoMinimo: true };
  const [primeira, segunda, terceira] = aptas;
  const opcoes: Avaliacao[] = [primeira!];
  if (segunda) opcoes.push(segunda);
  if (terceira && primeira!.nota - terceira.nota <= janelaTerceiraOpcao) opcoes.push(terceira);
  return { opcoes, nenhumaAcimaDoMinimo: false };
}
