# Exemplo de Regras de Status na Alteração de Pacotes

## Visão Geral
Este documento demonstra como as regras de status são aplicadas automaticamente quando um atleta altera seu pacote.

## Regras Implementadas

### 1. Status 'approved' → 'sent'
**Cenário**: Atleta com status aprovado altera pacote
```typescript
// Antes da alteração
athlete.status = 'approved'

// Após alterar pacote
await athletePackagesService.changeAthletePackage(athleteId, newPackageId)

// Resultado
athlete.status = 'sent' // Mudou de 'approved' para 'sent'
```

**Justificativa**: Atleta aprovado que altera pacote volta para status de envio para nova análise.

### 2. Status 'sent' → 'sent'
**Cenário**: Atleta com status enviado altera pacote
```typescript
// Antes da alteração
athlete.status = 'sent'

// Após alterar pacote
await athletePackagesService.changeAthletePackage(athleteId, newPackageId)

// Resultado
athlete.status = 'sent' // Manteve 'sent'
```

**Justificativa**: Atleta com envio pendente mantém status ao alterar pacote.

### 3. Status 'pending' → 'pending'
**Cenário**: Atleta com status pendente altera pacote
```typescript
// Antes da alteração
athlete.status = 'pending'

// Após alterar pacote
await athletePackagesService.changeAthletePackage(athleteId, newPackageId)

// Resultado
athlete.status = 'pending' // Manteve 'pending'
```

**Justificativa**: Atleta pendente mantém status ao alterar pacote.

### 4. Status 'rejected' → 'rejected'
**Cenário**: Atleta com status rejeitado altera pacote
```typescript
// Antes da alteração
athlete.status = 'rejected'

// Após alterar pacote
await athletePackagesService.changeAthletePackage(athleteId, newPackageId)

// Resultado
athlete.status = 'rejected' // Manteve 'rejected'
```

**Justificativa**: Atleta rejeitado mantém status ao alterar pacote.

## Implementação Técnica

### Serviço Principal
```typescript
export const athletePackagesService = {
  async changeAthletePackage(athleteId: string, packageId: string): Promise<void> {
    // 1. Obter status atual do atleta
    const { data: athlete } = await supabase
      .from('athletes')
      .select('status')
      .eq('id', athleteId)
      .single()

    // 2. Aplicar regras de status
    let newStatus = athlete.status
    switch (athlete.status) {
      case 'approved':
        newStatus = 'sent'
        break
      case 'sent':
        newStatus = 'sent' // mantém
        break
      case 'pending':
        newStatus = 'pending' // mantém
        break
      case 'rejected':
        newStatus = 'rejected' // mantém
        break
      default:
        newStatus = athlete.status
    }

    // 3. Atualizar status se necessário
    if (newStatus !== athlete.status) {
      await supabase
        .from('athletes')
        .update({ status: newStatus })
        .eq('id', athleteId)
    }

    // 4. Atualizar pacote
    await this.upsertPackage(athleteId, packageId, 'pending')
  }
}
```

### Uso na Interface
```typescript
const handleSubmit = async () => {
  try {
    // Usar o serviço que aplica as regras automaticamente
    await athletePackagesService.changeAthletePackage(athlete.id, selectedPackageId)
    
    // Sucesso - status foi atualizado conforme regras
    toast({
      title: 'Pacote alterado com sucesso!',
      description: 'Sua solicitação foi registrada.',
      variant: 'default'
    })
  } catch (error) {
    // Tratamento de erro
  }
}
```

## Fluxo Completo

### 1. Atleta Aprovado Altera Pacote
```
Status Inicial: 'approved'
↓
Atleta seleciona novo pacote
↓
Sistema aplica regra: approved → sent
↓
Status Final: 'sent'
Pacote: 'pending'
```

### 2. Atleta Enviado Altera Pacote
```
Status Inicial: 'sent'
↓
Atleta seleciona novo pacote
↓
Sistema aplica regra: sent → sent
↓
Status Final: 'sent'
Pacote: 'pending'
```

### 3. Atleta Pendente Altera Pacote
```
Status Inicial: 'pending'
↓
Atleta seleciona novo pacote
↓
Sistema aplica regra: pending → pending
↓
Status Final: 'pending'
Pacote: 'pending'
```

### 4. Atleta Rejeitado Altera Pacote
```
Status Inicial: 'rejected'
↓
Atleta seleciona novo pacote
↓
Sistema aplica regra: rejected → rejected
↓
Status Final: 'rejected'
Pacote: 'pending'
```

## Benefícios da Implementação

### Para o Sistema
- ✅ **Consistência**: Regras aplicadas automaticamente
- ✅ **Auditoria**: Histórico de mudanças de status
- ✅ **Segurança**: Validações no backend
- ✅ **Performance**: Cache atualizado automaticamente

### Para o Usuário
- ✅ **Transparência**: Status sempre atualizado
- ✅ **Simplicidade**: Regras aplicadas sem intervenção
- ✅ **Flexibilidade**: Pode alterar pacote a qualquer momento

### Para a Administração
- ✅ **Controle**: Status reflete mudanças de pacote
- ✅ **Rastreabilidade**: Histórico completo de alterações
- ✅ **Padronização**: Regras consistentes para todos

## Considerações de Implementação

### 1. Transações
- Todas as operações (status + pacote) são executadas em sequência
- Se uma falhar, a outra não é executada
- Cache é invalidado apenas após sucesso total

### 2. Validações
- Status do atleta é validado antes da alteração
- Pacote selecionado é validado
- Usuário deve ter permissão para alterar

### 3. Cache
- Cache do atleta é invalidado após alteração
- Cache de listas é invalidado para refletir mudanças
- Dados são recarregados automaticamente

### 4. Logs
- Todas as alterações são registradas
- Histórico de mudanças de status
- Rastreabilidade completa das operações
