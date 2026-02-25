#!/bin/bash
echo "=== Verificacion de extensibilidad ==="
echo ""

# 1. Categorias hardcodeadas en el codigo?
echo "1. Categorias hardcodeadas:"
grep -rn 'vehiculos\|maquinaria\|hosteleria\|horecaria' app/ server/ --include='*.ts' --include='*.vue' | grep -v node_modules | grep -v '.nuxt' | grep -v 'i18n' | grep -v 'migrations' | head -10
echo ""

# 2. Idiomas hardcodeados (que no sean config)?
echo "2. Idiomas hardcodeados fuera de config:"
grep -rn "'es'\|'en'\|'fr'" app/ --include='*.ts' --include='*.vue' | grep -v 'i18n' | grep -v 'locale' | grep -v 'node_modules' | grep -v '.nuxt' | head -10
echo ""

# 3. URLs/dominios hardcodeados?
echo "3. Dominios hardcodeados:"
grep -rn 'tracciona\.com\|tank-iberica\.com' app/ server/ --include='*.ts' --include='*.vue' | grep -v node_modules | head -10
echo ""

echo "4. Hardcoded AI model strings:"
grep -rn "claude-3\|claude-sonnet\|claude-haiku\|gpt-4o" server/ --include='*.ts' | grep -v node_modules | grep -v aiConfig.ts | head -10
echo ""

echo "5. Hardcoded Supabase project ref:"
grep -rn "gmnrfuzekbwyzkgsaftv" . --include='*.ts' --include='*.yml' --include='*.yaml' | grep -v node_modules | head -10
echo ""

echo "Si alguna seccion muestra resultados, hay acoplamiento que corregir."
