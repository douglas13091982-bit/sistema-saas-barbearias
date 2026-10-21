# SaaS de barbearias

## Regras implementadas

- `/` apresenta a plataforma; `/cadastro` cria conta e barbearia após confirmação de e-mail.
- Cada barbearia tem seu endereço `/<slug>`, site e painel `/admin`, com dados isolados por tenant e RLS.
- A barbearia existente é preservada em `/barbershop-pro`. Seu único administrador existente recebe o acesso de plataforma `/super-admin` na migração inicial.
- O super admin define o valor mensal por barbeiro. O valor inicialmente fica vazio, sem cobrança até sua definição. Alterações valem para novas assinaturas; contratos existentes mantêm o valor contratado.
- Teste de sete dias por barbearia, contado da criação. Todos os barbeiros cadastrados podem agendar no teste. Após isso cada agenda exige período pago vigente.
- Cada barbeiro tem uma assinatura mensal independente. Inativar o perfil não cancela a cobrança. Cancelamento interrompe renovações e mantém o período já pago. Cancele antes de excluir o perfil; registros financeiros ficam arquivados.
- Assinatura autorizada, retorno do checkout e status enviado pelo navegador nunca liberam a agenda. Só pagamento aprovado, validado na API oficial e registrado no servidor, concede acesso.

## Configuração segura para Mercado Pago

Configure apenas no ambiente de servidor do Lovable (nunca no código, navegador ou conversa):

- `MERCADO_PAGO_ACCESS_TOKEN`: credencial da aplicação recebedora.
- `MERCADO_PAGO_WEBHOOK_SECRET`: assinatura secreta das notificações dessa aplicação.
- `MERCADO_PAGO_PUBLIC_KEY`: chave pública da mesma aplicação Mercado Pago. Ela é entregue ao navegador somente para inicializar os campos seguros do CardForm; nunca coloque o access token no frontend.
- `APP_URL`: URL HTTPS publicada da plataforma; neste projeto `https://menubarber.lovable.app`.

Na aplicação Mercado Pago configure a URL HTTPS `${APP_URL}/api/mercadopago/webhook` para os eventos `subscription_preapproval`, `subscription_authorized_payment` e `payment`. A prontidão do checkout exige as quatro variáveis acima. O CardForm oficial do Mercado Pago coleta e tokeniza os dados dentro dos campos seguros; o servidor recebe apenas o token de uso único e não armazena número, validade ou CVV.

Valide primeiro com a chave pública e o access token de teste da mesma aplicação e os cartões/usuários de teste publicados pelo Mercado Pago. Não use dados reais durante o teste. Confirme que a assinatura aparece no Mercado Pago, que a agenda não libera só pela autorização, e que a confirmação do pagamento pelo webhook libera somente o barbeiro correspondente. Depois da validação, substitua as duas credenciais por produção e confirme novamente o webhook.

Teste completo necessário antes de abrir vendas: criar barbearia, configurar preço, cadastrar dois barbeiros, autorizar assinatura de um, aguardar pagamento aprovado, conferir somente sua liberação após o teste; conferir renovação, falha, cancelamento e estorno. Não foram realizados pagamentos reais ou de sandbox neste ambiente: credenciais não disponibilizadas.

## Banco e publicação

Aplique em ordem as migrações `20261021160000_saas_tenants.sql` e `20261021160100_saas_booking.sql` uma única vez, coordenadas com a publicação do novo frontend. A chave de registros passa de `(kind,id)` para `(tenant_id,kind,id)`; o frontend anterior não é compatível com gravações depois da migração.

`supabase/tests/saas_assertions.sql` é um roteiro transacional: execute as migrações e os asserts entre `BEGIN` e `ROLLBACK` em ambiente ainda sem a migração, retirando os BEGIN/COMMIT internos. Valida isolamento, teste de sete dias, bloqueio sem pagamento, confirmação, replay, estorno e permissões. Não executá-lo isoladamente em produção.

Validação local: `npm test`, `npx tsc --noEmit`, `npm run build`. Notificações têm HMAC validado antes de acesso privilegiado e a API oficial é consultada para conciliar os pagamentos. Identificadores de pagamento são únicos; reenvios não ampliam o período pago.
