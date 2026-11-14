# Empreendimentos: ficha, cadastro, mídias, Vitrine Destacada e Mais Buscados

> **Origem:** SPEC 1.0, §6 Empreendimentos — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** v1: ficha, cadastro em 4 etapas pela equipe da plataforma, tabela de vendas, condições, comissão, R.I. e mídias. Fase 2: cadastro pela própria incorporadora. Fase 3: Vitrine Destacada e Mais Buscados.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Fase de venda e pré-lançamento avaliados por subcondomínio (ver `busca-e-recomendacao.md`).
- Localização sem PostGIS na v1: latitude e longitude no subcondomínio, com índice; PostGIS entra depois, de forma aditiva, se a escala pedir.
- Arquivos: armazenamento S3 compatível em Cloudflare R2 (aprovado, D8). O MinIO deixou de ser opção: as imagens oficiais saíram do Docker Hub em 2025.
- Upload: além de tipo pelos bytes e 10 MB, remover metadados EXIF (posição GPS) e limitar dimensões.
- CEP (ViaCEP) e embed do YouTube continuam atrás de flag e do OK do Matheus.

---

## Empreendimentos

### Dados

Ficha padronizada: nome, incorporadora (nome comercial e razão social), localização, tipologias, status de obra, status de venda, previsão de entrega, descrição, mídias e documentos.

Dados legais: número do R.I. ou matrícula, cartório, data do registro e patrimônio de afetação.

Espelho de unidades: disponível, reservada e vendida, atualizado pela equipe e pelo gerente da incorporadora. Toda mudança gera um movimento no histórico (só acrescenta linhas).

Planos de pagamento como dados: sinal, mensais (com número de parcelas), intercaladas, chaves, saldo e índice de correção.

Comissão de cada lançamento em campo editável. Só a equipe da plataforma altera R.I. e comissão depois de publicado.

Fase de venda calculada, sem campo próprio: data de lançamento futura = pré-lançamento (stand-by); todos os subcondomínios 100% vendidos = esgotado.

Finalidade "Aluguel" é salva e aparece na página; o fluxo de aluguel fica fora do MVP.

### Cadastro em 4 etapas (fluxo da Bloco, com interface, textos e listas próprios)

Salva sozinho a cada mudança (debounce de 800 ms), com o indicador "Salvo" anunciado por aria-live.

#### Etapa 1. Empreendimento

Nome (obrigatório, mínimo 4 caracteres), CNPJ opcional (00.000.000/0000-00), registro de incorporação (opcional no cadastro, obrigatório para publicar).

Tipo: Novo ou Terceiro/Classificado. Visibilidade: Ativo; Não listado (salvo, fora da vitrine, abre por link para quem tem login); Exclusivo (visível só para a house, fora do mapa e da busca).

Descrição, vídeos (links do YouTube), foto de capa (JPG ou PNG, sugerido 1200 × 675 px), link do mapa interativo, andamento da obra (etapas com nome e %, botão "Adicionar etapa").

#### Etapa 2. Subcondomínios (torre, bloco ou fase; no mínimo 1)

Nome; status (Na planta, Em obra, Pronto, 100% vendido); grupo (Residencial; Loteamento ou condomínio horizontal; Comercial; Residencial e comercial); pavimentos; elevadores; datas de lançamento e entrega.

Endereço: CEP preenche o resto (ViaCEP, chamado pelo servidor, precisa do OK de Matheus); endereço e número obrigatórios; estado e cidade de um arquivo do IBGE versionado; bairro em texto com sugestão dos já cadastrados; complemento opcional; pin no mapa por clique ou arraste; "Localizar no mapa" centraliza na cidade, sem geocodificação.

Infraestrutura: caixas de marcar com busca e "Todos", em dois grupos (uso comum; infraestrutura e segurança), mais "Outros itens" em texto livre. O catálogo é próprio, editável pelo god mode, com cerca de 60 itens de uso comum e 40 de segurança.

Botão "Adicionar subcondomínio".

#### Etapa 3. Tipologias (painel lateral que salva sozinho)

Nome (ex.: "2 dormitórios final 01", "Garden").

Tipo — Residencial: Apartamento, Casa, Casa de condomínio, Casa em condomínio rural, Chácara, Cobertura, Duplex, Duplex garden, Fazenda, Flat, Garden, Kitnet, Loft, Mansão em condomínio fechado, Sobrado, Sobrado duplex, Sobrado triplex, Studio. Comercial: Box, Casa comercial, Conjunto comercial, Depósito, Galpão, Loja, Loja comercial, Loja shopping, Pavilhão, Prédio inteiro, Sala comercial, Sala comercial aérea, Sala comercial térrea. Terreno: Lote, Terreno, Terreno em condomínio, Terreno padrão.

Finalidade: Venda; Aluguel; Venda e/ou aluguel.

Planta baixa (upload); dormitórios, suítes, suítes master, banheiros, lavabos e vagas.

Subcondomínios que usam a tipologia: no mínimo 1. A área privativa não entra aqui (vai para a Tabela de vendas). Opção "Clonar existente".

Etapa 4. Revisar: resumo das etapas com "Editar" em cada bloco e o botão final "Ir para empreendimentos".

Abas depois do cadastro: Tabela de vendas (unidades, área privativa, preço e status), Condições comerciais (planos, entrada e financiamento), Comissão, Localização (pontos próximos com categoria e distância) e Equipe de vendas.

### Mídias

Imagens: só JPG, PNG e WebP, até 10 MB. Sem SVG de upload.

Vídeos: só links do YouTube validados, embutidos com youtube-nocookie.com; a CSP libera só esse domínio em frame-src. O embed precisa do OK de Matheus antes do primeiro uso [NEEDS CLARIFICATION: C12].

### Vitrine Destacada

A incorporadora compra por empreendimento, à parte da verba de mídia e sem precisar do projeto de mídia.

Planos mensal (30 dias), semestral (180) ou anual (360), contados a partir do pagamento. A equipe confirma o pagamento e ativa, com valor obrigatório. Termina sozinha e respeita um limite de vagas.

Só entra empreendimento publicado, com R.I. e vendas abertas. Se sair do ar ou esgotar, o destaque some.

Só visual: cor diferente e estrela no mapa, etiqueta de espaço pago no card. Não muda a ordem nem a busca.

### Mais Buscados

Empreendimentos orgânicos com mais cliques e buscas no mapa no mês vigente, contando só cliques de compradores. Durante a Vitrine Destacada, o empreendimento fica fora, e volta no dia seguinte ao fim, contando só o que veio depois.
