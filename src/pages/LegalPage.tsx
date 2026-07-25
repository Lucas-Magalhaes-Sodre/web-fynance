import ArticleIcon from '@mui/icons-material/Article';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link, Navigate, useParams } from 'react-router-dom';

const documents = {
  terms: {
    title: 'Termos de Uso',
    version: '2026-07-24',
    summary: 'Regras gerais para uso do Deluket Finance, contratação de planos, acesso e responsabilidades.',
    sections: [
      ['1. Serviço', 'O Deluket Finance é uma plataforma de organização financeira para controle de receitas, despesas, cartões, economias, metas, aniversários e lembretes. O sistema não substitui consultoria financeira, contábil, jurídica ou tributária.'],
      ['2. Conta e segurança', 'Cada usuário é responsável por manter seus dados de acesso protegidos e por informar dados verdadeiros no cadastro. O acesso administrativo é restrito a usuários autorizados.'],
      ['3. Planos dinâmicos', 'Os planos podem variar em nome, preço, duração, benefícios e promoções ao longo do tempo. As condições aplicáveis são aquelas exibidas na tela de contratação no momento em que o usuário confirma o pagamento.'],
      ['4. Cobrança e acesso', 'Ao contratar um plano, o usuário autoriza a cobrança pelo provedor de pagamento selecionado. O acesso pago permanece conforme o prazo, status de pagamento e condições do plano contratado.'],
      ['5. Alterações futuras', 'Mudanças futuras nos planos, preços ou duração não alteram automaticamente o snapshot da contratação já realizada, salvo em nova contratação, renovação ou ajuste informado ao usuário quando aplicável.'],
      ['6. Uso adequado', 'É proibido tentar acessar dados de outros usuários, explorar falhas, burlar controles de acesso, automatizar abuso da plataforma ou usar o sistema para finalidade ilegal.'],
      ['7. Limitações', 'Embora o sistema busque precisão, valores, projeções e alertas dependem dos dados informados pelo usuário e podem exigir conferência manual.'],
      ['8. Suspensão ou bloqueio', 'O acesso pode ser bloqueado em caso de inadimplência, suspeita de fraude, violação dos termos ou solicitação do próprio usuário.']
    ]
  },
  privacy: {
    title: 'Política de Privacidade',
    version: '2026-07-24',
    summary: 'Como o Deluket Finance trata dados pessoais em conformidade com a LGPD.',
    sections: [
      ['1. Dados coletados', 'Podemos tratar nome, e-mail, telefone, cidade, ocupação, preferências, registros financeiros inseridos pelo usuário, dados de assinatura, consentimentos, logs técnicos e dados necessários para segurança.'],
      ['2. Finalidades', 'Usamos dados para criar e manter a conta, operar funcionalidades financeiras, processar assinatura, cumprir obrigações legais, prevenir fraude, melhorar o produto e comunicar informações relevantes.'],
      ['3. Bases legais', 'O tratamento pode ocorrer para execução de contrato, cumprimento de obrigação legal, legítimo interesse, prevenção a fraude e consentimento quando necessário.'],
      ['4. Compartilhamento', 'Dados podem ser compartilhados com provedores essenciais, como hospedagem, banco de dados, autenticação, notificações e processadores de pagamento, sempre conforme a finalidade do serviço.'],
      ['5. Direitos do titular', 'O usuário pode solicitar acesso, correção, portabilidade, exclusão, informação sobre compartilhamento e revogação de consentimento, observados limites legais e contratuais.'],
      ['6. Segurança', 'Adotamos controles técnicos e organizacionais proporcionais, como autenticação, segregação por usuário, proteção de rotas administrativas e registro de ações relevantes.'],
      ['7. Retenção', 'Os dados são mantidos pelo tempo necessário para prestação do serviço, cumprimento de obrigações legais, defesa de direitos e auditoria.']
    ]
  },
  cookies: {
    title: 'Política de Cookies',
    version: '2026-07-24',
    summary: 'Como usamos cookies e tecnologias semelhantes.',
    sections: [
      ['1. Cookies necessários', 'São usados para login, segurança, preferências essenciais e funcionamento básico do sistema. Sem eles, algumas áreas podem não funcionar corretamente.'],
      ['2. Preferências', 'Podemos armazenar preferências como tema, idioma e escolhas de interface para melhorar a experiência.'],
      ['3. Métricas e marketing', 'Com autorização, podemos usar cookies ou identificadores para métricas, campanhas e melhoria de comunicação.'],
      ['4. Controle', 'O usuário pode configurar preferências no banner de cookies. Algumas escolhas podem ser armazenadas para respeitar consentimentos futuros.']
    ]
  },
  cancellation: {
    title: 'Cancelamento e Reembolso',
    version: '2026-07-24',
    summary: 'Regras de cancelamento, teste grátis e direito de arrependimento.',
    sections: [
      ['1. Teste grátis', 'Quando disponível, o teste grátis permite usar o sistema pelo período informado na oferta ou definido manualmente pelo administrador. Ao final, o acesso pode ser limitado até a contratação de um plano.'],
      ['2. Cancelamento', 'O usuário pode cancelar a assinatura conforme os meios oferecidos pelo provedor de pagamento ou pelo suporte do Deluket Finance. O cancelamento impede cobranças futuras quando processado corretamente.'],
      ['3. Direito de arrependimento', 'Para contratações online no Brasil, o consumidor pode exercer o direito de arrependimento no prazo legal de 7 dias, quando aplicável.'],
      ['4. Reembolsos', 'Reembolsos serão avaliados conforme a lei, status da assinatura, data da contratação, uso do serviço, regras do provedor de pagamento e política vigente no momento da compra.'],
      ['5. Planos dinâmicos', 'O valor e duração considerados para cancelamento ou reembolso são os do plano aceito no momento da contratação, incluindo eventuais cupons aplicados.']
    ]
  }
} as const;

export function LegalPage() {
  const { document } = useParams();
  const data = documents[document as keyof typeof documents];

  if (!data) return <Navigate to="/" replace />;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <ArticleIcon color="primary" />
              <Typography color="primary" fontWeight={900}>Deluket Finance</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950}>{data.title}</Typography>
            <Typography color="text.secondary" mt={1}>{data.summary}</Typography>
            <Typography variant="caption" color="text.secondary">Versão {data.version}</Typography>
          </Box>

          <Divider />

          {data.sections.map(([title, text]) => (
            <Box key={title}>
              <Typography variant="h6" fontWeight={900}>{title}</Typography>
              <Typography color="text.secondary">{text}</Typography>
            </Box>
          ))}

          <Divider />

          <Typography variant="body2" color="text.secondary">
            Este documento é uma base operacional e deve ser revisado por profissional jurídico antes de campanhas comerciais de maior escala.
          </Typography>
          <Typography>
            <Link to="/">Voltar para a página inicial</Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
