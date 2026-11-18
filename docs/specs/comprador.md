# Interface do comprador

> **Origem:** SPEC 1.0, §5 Interface do comprador (exceto questionário e cálculo, que estão em `busca-e-recomendacao.md`) — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** v1: navegação, modo Morar/Investir, página do empreendimento, resultado, visita, falar com o gerente, login, conta e privacidade, home (estados novo, navegou, perfil e negociando). Fase 2: mapa público, favoritos, listas, comparador, alertas e home no estado ativo.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Na v1, a navegação mostra Início, Buscar Imóveis e Minha conta; Mapa e Favoritos entram na fase 2, atrás de flag.
- O navegador guarda só conveniências do visitante (progresso do questionário, modo, aviso de eventos). Eventos anônimos vão para o servidor, por cookie de visitante sem IP — senão não alimentam os números da incorporadora.
- Eventos: lista permitida de campos por tipo de evento, em vez de lista de campos proibidos.
- Home: "perfil" = questionário concluído; "ativo" = concluído e com favorito ou alerta.
- Mapa (fase 2): o limite de 5 s da geolocalização conta só depois da permissão. MapLibre com OpenFreeMap entra já na v1 no cadastro (pin) e na confirmação da visita (OpenFreeMap aprovado).
- E-mail real (recuperação de senha e confirmação de visita) antes de abrir para compradores reais.

---

## Navegação e modo

### Navegação

Cinco áreas, numa barra inferior fixa no celular e num menu superior fixo no desktop:

| Área | Rota |
| --- | --- |
| Início | / |
| Buscar Imóveis | /buscar-imoveis e /buscar-imoveis/resultado |
| Mapa | /mapa |
| Favoritos | /favoritos |
| Minha conta | /conta/* |

Rotas transversais: /empreendimento/{slug} e /empreendimento/{slug}/agendar.

De qualquer tela, "Agendar visita" e "Falar com o gerente" ficam a no máximo 2 toques.

O estado dos filtros e do modo fica na URL, para compartilhar e voltar.

Login só para: favoritar, agendar visita, criar alerta, enviar proposta e acessar o painel. Navegar, responder, ver resultado e usar o mapa são livres.

### Modo Morar/Investir

Modo global morar ou investir, definido pela primeira pergunta do questionário e alterável por um seletor no topo. Fica no perfil, com conta, ou no navegador, sem conta.

O modo não esconde dado: muda a ordem dos blocos, os destaques, os textos e a cor de apoio.

Card: Morar destaca entrada, parcela mensal, quartos e distância da escola. Investir destaca preço/m², custo total, entrega e plano de pagamento.

CTA principal: Morar, "Agendar visita". Investir, "Ver análise completa" e depois "Agendar visita".

Cores de apoio: uma quente para Morar e uma fria para Investir, com contraste AA medido [NEEDS CLARIFICATION: C1].

## Resultado, página, visita, mapa, home, favoritos, conta e eventos

### Resultado "Seus imóveis"

Resumo do perfil numa linha, com chips que voltam à pergunta correspondente.

De 2 a 3 cards: foto, nome, bairro, nota de 0 a 100, motivo, entrada mais parcela, selos, "Agendar visita" e "Ver detalhes".

"Por que estou vendo isso?" mostra cada componente com peso, nota, detalhe e o que ficou fora da conta.

"Ver no mapa" abre /mapa com os filtros do questionário.

Cartão do gerente: nome, foto, cargo, WhatsApp, e-mail e telefone.

Informe que as indicações vêm só dos empreendimentos da base da plataforma.

### Página do empreendimento

#### Ordem no modo Morar

1. Galeria e selos (capa, fotos, vídeos do YouTube, link do mapa interativo).
2. Resumo: nome, bairro, construtora, entrega, % de obra e status de vendas.
3. Barra fixa no celular, com a entrada e "Agendar visita".
4. Seus custos ("Quanto você paga de verdade, mês a mês"): sinal, mensais com o índice do plano (INCC), intercaladas, chaves, saldo, financiamento, ITBI e registro, marcados como estimativa [NEEDS CLARIFICATION: C7].
5. Plantas e unidades por tipologia: área privativa, preço e status. "Restam {x}" só com espelho atualizado há menos de 24 h.
6. Vizinhança: escola, parque, hospital, academia, mercado e transporte mais próximos, com ícone por categoria, nome, distância e tempo a pé (80 m/min). Uma frase resume ("Escola a 6 min a pé, parque a 10 min"). Vem do cadastro, sem serviço pago e sem IA.
7. Números do investimento permitidos (sem indicador de mercado).
8. Interesse no empreendimento [NEEDS CLARIFICATION: C4].
9. Comodidades.
10. Escritório de vendas.
11. Dados legais: número do R.I., cartório, data do registro e patrimônio de afetação. Sem CRECI.
12. Empreendimentos parecidos.

Modo Investir: números primeiro (preço/m², custo total, entrega e plano), depois custos, plano de pagamento, região e galeria. Projeção feita com dados da pessoa leva "Projeção", a data e "Não é garantia".

#### Regras da página

O comprador vê preço, fluxo de pagamento de cada plano com valores calculados para a unidade escolhida, entrada mínima e regras de financiamento (se aceita, em que momento, % máximo, FGTS, dação e tipos, parcelamento direto).

Campo sem dado aparece como "Não informado".

Selo "Incorporação registrada" no card e na página.

"Perguntas para fazer na visita" não fica na página: vai para a confirmação da visita.

Coração para favoritar e "Adicionar à lista".

Escritório de vendas (modelo Reelly): nome, foto, cargo, experiência, [EMPRESA] e os botões WhatsApp (wa.me com mensagem pronta), e-mail (mailto) e telefone (tel). Em cada empreendimento, a incorporadora escolhe quem aparece: o plantão dela ou o gerente de contas da house. O padrão é a house. Se o primeiro clique de contato exige login, consentimento e cria o lead "Contato direto": [NEEDS CLARIFICATION: C3].

Proposta do comprador: unidade, valor, formas de pagamento, validade e consentimento, sem efeito jurídico. A incorporadora aceita, recusa com motivo ou faz contraproposta. Como o comprador envia: [NEEDS CLARIFICATION: C10].

### Agendamento de visita

Três toques: dia, horário e confirmar, com os dados já preenchidos. Sem questionário.

Pede login rápido antes de confirmar e registra o consentimento de visita, com a versão do texto.

A visita vai para a fila do analista da house e libera nome e contato só à incorporadora daquele empreendimento.

A confirmação mostra endereço e mapa, o gerente, "o que levar", as perguntas para fazer na visita, "Adicionar ao calendário" (.ics) e o aviso de lembrete por WhatsApp (simulado).

### Mapa (público)

Centro inicial, nesta ordem: (1) coordenadas da URL (lat, lng, z); (2) localização do navegador, depois de uma tela de explicação, com enableHighAccuracy: false, timeout: 5000, maximumAge: 600000; (3) cidade pelo IP, por função de servidor plugável; (4) Porto Alegre (lat −30,0346, lng −51,2177, zoom 11 a 12).

Posição exata nunca é guardada sem consentimento; para personalizar, no máximo a cidade.

Botão "Minha localização" e navegação livre pelo Brasil.

Busca por cidade, bairro ou nome, com sugestões agrupadas por tipo; sugestões por tipo, preço total ou por m², área, vagas, "Perto de mim" e "Buscar nesta área".

Agrupamentos com a quantidade; ao aproximar, pinos com o preço de entrada. Variações de pino: padrão, compatível com o perfil, patrocinado (cor diferente e estrela, sem prioridade) e visto.

Lista deslizante no celular (fechada, metade e cheia) e painel lateral no desktop, com os cards da área visível, atualizada com debounce de 300 ms. Alternância "Mostrar lista" / "Mostrar mapa".

Filtros com os campos do questionário e contagem ao vivo no botão "Ver {n} empreendimentos". Atalho "Usar meu perfil".

Toque no pino abre card rápido: foto, nome, entrada mais parcela, % de obra, coração e "Ver detalhes".

"Me avise de novos lançamentos nesta área" cria alerta de área com o recorte visível.

Área vazia: "Ainda não temos lançamentos aqui. Quer ser avisado quando chegar?", com alerta de área e o evento map_empty_area como sinal de demanda.

### Início (home conforme o estado)

Função pura resolveHomeState escolhe o estado a partir de usuário, eventos, perfil, favoritos e visitas:

| Estado | O que mostra |
| --- | --- |
| novo | Hero com a promessa do modo, "Descubra seu imóvel em 2 minutos", "Prefiro explorar no mapa" e seletor de modo; faixa de confiança (incorporação registrada, curadoria com IA e humana, atendimento com nome); "Como funciona" em 3 passos; destaques [NEEDS CLARIFICATION: C13]; indicadores dos bairros [NEEDS CLARIFICATION: C5]; prova social só com dado real [NEEDS CLARIFICATION: C6]; rodapé com privacidade, sem CRECI |
| navegou | "Continue de onde parou" e convite ao questionário |
| perfil e ativo | "Seus imóveis", "O que mudou nos seus favoritos" e "Novos no seu perfil" |
| negociando | Status da visita ou proposta e o gerente |

### Favoritos, listas, comparador e alertas

Coração em todo card e pino. No MVP, favoritar não pede login: o favorito fica no cookie de visitante de 90 dias e passa para a conta quando a pessoa entra (fatia 1.4; decisão de 18/11/2026). Depois de favoritar, convide a criar um alerta.

Listas: criar, renomear, excluir e mover entre listas.

Selo "Novidade" quando o empreendimento mudou desde a última visita da pessoa.

Comparador de até 3: custo total, entrega, m², distâncias e indicadores permitidos.

Alertas dos tipos perfil, favorito, área, preço e obra; empreendimento novo nas buscas salvas; nos favoritos, mudança de preço, unidade nova, disponibilidade e fase de venda. Canal (WhatsApp, e-mail ou push, simulados) e frequência. Marcar como visto, pausar e desligar.

Mudanças de preço, % de obra, status e unidades ficam registradas como mudança de cadastro (project_change), para os alertas e a home.

### Painel do comprador (/conta)

Visitas e propostas enviadas, com status, próximo passo, contraproposta e cancelar.

Privacidade: consentimentos por empreendimento (com versão e data), revogar, baixar os dados em JSON, apagar o histórico, pausar alertas e excluir a conta com confirmação. A exclusão anonimiza os eventos e mantém os registros financeiros.

Configurações: perfil, mudar senha, refazer o questionário, modo padrão, notificações e localização.

### Login e conta

Login rápido no momento de valor ("Continuar com seu e-mail" ou conta existente). E-mail e senha, com recuperação; Google só depois do registro completo.

merge_visitor: no login, o histórico anônimo e os favoritos locais passam para a conta.

Depois do login, a pessoa volta à tela de origem. O retorno só aceita caminho interno, para evitar redirecionamento aberto.

### Eventos de uso

Gravados com um ID anônimo, sem IP e sem posição exata, com aviso curto no primeiro acesso:

quiz_start, quiz_answer (pergunta, valor, contagem antes e depois), quiz_option_disabled, quiz_widen_accepted, quiz_complete, contact_submitted, result_view, result_why_open, result_map_open, map_open (origem da posição: url, browser, ip, default), map_geo_permission, map_move, map_pin_click, map_empty_area, map_area_alert_created, project_view, costs_simulated, manager_contact (canal), visit_started, visit_scheduled, favorite_add, alert_created, mode_changed.

### Textos de referência

| Chave | Texto |
| --- | --- |
| home.hero.morar | O lar que cabe na sua vida. A gente analisa, você só visita. |
| home.hero.investir | Só o que passou na nossa análise. Com os números na mesa. |
| home.relief | Sem decorado perdido. Sem conta escondida. Sem pressão de vendedor. |
| quiz.counter | {n} empreendimentos |
| quiz.counter.one | {n} empreendimento |
| quiz.progress | Pergunta {i} de {total} |
| quiz.almost | Restam {n} empreendimentos no seu perfil. Falta pouco. |
| quiz.analyzing | Analisando os {n} empreendimentos do seu perfil… |
| quiz.contact | Seus imóveis estão prontos. Para onde enviamos? |
| quiz.option.none | nenhum no momento |
| quiz.widen | Poucas opções com esse filtro. Quer incluir bairros vizinhos? |
| result.why | Por que estou vendo isso? |
| map.geo.ask | Quer ver os lançamentos perto de você? Usamos sua localização só para centralizar o mapa. |
| map.empty | Ainda não temos lançamentos aqui. Quer ser avisado quando chegar? |
| map.alert | Me avise de novos lançamentos nesta área |
| map.filters.cta | Ver {n} empreendimentos |
| project.costs.title | Quanto você paga de verdade, mês a mês |
| project.projection.disclaimer | Projeção calculada em {data} com {indicadores}. Não é garantia. |
| visit.confirmed | Pronto! {dia}, {hora}, você conhece o seu possível novo lar. {gerente} te espera. |
| favorites.empty | Toque no coração para acompanhar um imóvel. A gente avisa quando algo mudar. |
