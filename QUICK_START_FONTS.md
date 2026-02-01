# 🚀 Deploy Rápido: Fontes PDFKit

## ✅ Problema Resolvido

PDFs de receitas quebravam em Linux por falta de fontes.

## 📦 Solução

1. **Script de instalação:** `scripts/install-fonts.sh`
2. **Fallback seguro:** Sempre funciona (mesmo sem fontes)
3. **Rota de teste:** `GET /debug/pdf-test`
4. **Teste local:** `npm run test:pdf`

## 🚀 Deploy (3 comandos)

```bash
# 1. Deploy da aplicação
bash scripts/deploy-prod.sh

# 2. Instalar fontes (REQUER SUDO - fazer UMA VEZ)
sudo bash scripts/install-fonts.sh

# 3. Testar
curl -o test.pdf http://localhost:3000/debug/pdf-test
```

## 📚 Documentação

- [FONTS_GUIDE.md](FONTS_GUIDE.md) - Guia completo
- [FONTS_CHECKLIST.md](FONTS_CHECKLIST.md) - Checklist
- [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) - Deploy atualizado

## ✅ Pronto!

Caracteres especiais (ã, ç, é) agora funcionam perfeitamente em PDFs!
