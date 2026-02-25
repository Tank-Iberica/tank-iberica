#!/bin/bash
# Genera docs/ESTADO-REAL-PRODUCTO.md a partir del codigo real
OUTPUT="docs/ESTADO-REAL-PRODUCTO.md"

echo "# Estado real del producto" > $OUTPUT
echo "" >> $OUTPUT
echo "_Generado automaticamente: $(date '+%Y-%m-%d %H:%M')_" >> $OUTPUT
echo "" >> $OUTPUT

echo "## Paginas" >> $OUTPUT
echo '```' >> $OUTPUT
find app/pages -name '*.vue' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Composables" >> $OUTPUT
echo '```' >> $OUTPUT
find app/composables -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Server API" >> $OUTPUT
echo '```' >> $OUTPUT
find server/api -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Migraciones BD" >> $OUTPUT
echo '```' >> $OUTPUT
ls supabase/migrations/ >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Middlewares" >> $OUTPUT
echo '```' >> $OUTPUT
find server/middleware -name '*.ts' | sort >> $OUTPUT
find app/middleware -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "## Utils" >> $OUTPUT
echo '```' >> $OUTPUT
find server/utils -name '*.ts' | sort >> $OUTPUT
echo '```' >> $OUTPUT
echo "" >> $OUTPUT

echo "Total paginas: $(find app/pages -name '*.vue' | wc -l)" >> $OUTPUT
echo "Total composables: $(find app/composables -name '*.ts' | wc -l)" >> $OUTPUT
echo "Total endpoints: $(find server/api -name '*.ts' | wc -l)" >> $OUTPUT
echo "Total migraciones: $(ls supabase/migrations/ | wc -l)" >> $OUTPUT
