# Negócio e produto

> **Origem:** SPEC 1.0, §1 O produto, §4 Jornada principal e §16 Fora do MVP — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** contexto de negócio para todas as fases; o escopo de cada fase está em `docs/SPEC.md`.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- A jornada completa abaixo é a visão do produto. A v1 (piloto) cobre do cadastro à passagem ao gerente de produtos; proposta, reserva e contrato entram na fase 3, e lead de mídia na fase 3.
- Regra 16 revisada pela D17: no piloto, dados reais só em produção; desenvolvimento, homologação e testes continuam só com dados fictícios.

---

## O produto

O que é: um ecossistema de geração de demanda para lançamentos imobiliários. A incorporadora (ou construtora, que é o mesmo perfil) vende direto ao comprador e ao investidor, que são atendidos pela house de vendas interna da plataforma.

Nome: ainda não existe. "Imob" é o nome de trabalho nos documentos e "Vieza" é provisório na interface. Centralize nome e logotipo num único arquivo de configuração (config/brand.ts) e evite o nome em textos da interface, para a troca ser simples.

Praça: o MVP atende poucas incorporadoras numa única praça. Cliente e praça reais ainda não existem (P5). A praça fictícia do protótipo é Porto Alegre.

Posicionamento: plataforma e ecossistema, não corretor autônomo nem imobiliária B2C.

Por quê: encurtar o ciclo de vendas, gerar demanda qualificada e controlada e levar mais gente à visita.

### Referências de fluxo (benchmarks)

| Referência | O que se aproveita |
| --- | --- |
| QuintoAndar | O comprador navega sem barreira de conta e vai direto à visita |
| Reelly | Escritório de vendas com nome, cargo, empresa, WhatsApp, e-mail e telefone; estrutura de dados do empreendimento |
| Bloco | Fluxo do cadastro de empreendimento em 4 etapas |
| Órulo e Netspaces | Mercado: Órulo é só hub; Netspaces é concorrente direta. O diferencial é a engenharia de demanda somada ao comercial próprio |

Nunca copie marca, textos, listas, imagens ou ativos dessas referências. Use só o padrão de fluxo.

### Dois produtos separados

| Produto | O que é | Indicadores |
| --- | --- | --- |
| Plataforma | Comprador e investidor usam de graça: buscam, respondem ao questionário, recebem de 2 a 3 opções e agendam visita. A house atende | VGV, leads direcionados, compatibilidade média e conversão lead → visita → proposta → contrato |
| Projeto de mídia (contratado à parte) | A incorporadora entrega a verba, e a Imob opera as campanhas. Os leads são exclusivos dela, atendidos pela equipe de vendas dela ou pela house | Verba, gasto, saldo, CPL, CAC, ROI por canal, leads por R$ 1.000 e curva de conversão por campanha |

Tudo do projeto de mídia só aparece para a equipe da plataforma e para a incorporadora que contratou.

### Visão total do produto (contexto, não é escopo inteiro do MVP)

Gestão do investimento de mídia da construtora: criativos estáticos e em vídeo, mídia paga, funil e indicadores. O lead é da construtora.

House de vendas: o comprador/investidor passa por uma triagem em nossa plataforma, respondendo um questionário bem extenso de perguntas qualificatórias, onde direcionamos para o imóvel ideal. O objetivo final é conectar o comprador diretamente com a incorporadora.

Incorporadora direto com o cliente, no modelo QuintoAndar.

### Metas de VGV

| Período | VGV |
| --- | --- |
| Por mês, no ano 1 | R$ 2 milhões |
| Ano 1 | R$ 24 milhões |
| Ano 2 | R$ 48 milhões |
| Ano 3 | R$ 100 milhões |
| Ano 4 | R$ 250 milhões |
| Ano 5 | R$ 500 milhões |

VGV não é receita da Imob. A comissão é negociada com cada incorporadora e registrada em campo editável.

## Jornada principal

1. A equipe cadastra o empreendimento (ou a incorporadora cadastra), com R.I., e a comissão é negociada e registrada.
2. O comprador entra por Buscar Imóveis (questionário com contagem ao vivo) ou pelo Mapa, sem precisar de conta.
3. O sistema mostra de 2 a 3 opções, com nota e motivo, usando só os dados cadastrados e as respostas.
4. O comprador agenda a visita (3 toques) ou fala com o gerente (WhatsApp, e-mail ou telefone). O login é pedido só neste momento de valor.
5. A analista da house recebe o lead, qualifica e garante a visita. A visita agendada libera nome e contato só à incorporadora daquele empreendimento.
6. Depois da visita, a analista passa ao gerente de produtos da incorporadora. Sem venda, oferece produtos semelhantes; a outra incorporadora só recebe o contato quando o comprador confirmar interesse nela.
7. Proposta, reserva e contrato passam pelo sistema. A venda atualiza o espelho de unidades, a comissão e os dashboards.

Lead de mídia: quem chega por campanha faz o mesmo questionário, só vê a incorporadora da campanha e é atendido pela equipe de vendas dela ou pela house.

Lead do questionário sem conta: nome e WhatsApp deixados no fim criam o lead na fila da house, em rodízio. A incorporadora continua sem ver nome e contato até a visita.

## Fora do MVP

Decidido: leilão de leads, tokenização, vacância e indicadores de mercado, corretor, imobiliária, parcerias e anúncios de corretor.

Para depois: anúncio de imóvel fora da base, imóveis prontos de terceiros, fluxo de aluguel, integração automática com plataformas de anúncio (o gasto entra à mão), eventos, API e white label, envio real de WhatsApp e push, cobrança e gateway de pagamento.

Fora do produto: financeiro interno da Imob (usar ERP pronto, com a verba dos clientes separada da receita) e funil comercial da própria Imob (usar CRM pronto).
