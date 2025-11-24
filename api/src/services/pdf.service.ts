import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

class PDFService {
  generateGlucoseReport(userData: any, glucoseRecords: any[], statistics: any) {
    const doc = new jsPDF()
    doc.setFont('helvetica')
    doc.setFontSize(20)
    doc.setTextColor(44, 62, 80)
    doc.text('Relatório de Glicemia - GlicoGest', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    let yPosition = 40

    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Dados do Paciente', 20, yPosition)
    yPosition += 10
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    doc.text(`Nome: ${userData.nome || 'Não informado'}`, 20, yPosition)
    yPosition += 7
    doc.text(`Email: ${userData.email || 'Não informado'}`, 20, yPosition)
    yPosition += 7
    doc.text(`Semana Gestacional: ${userData.semana_gestacional || 'Não informada'}`, 20, yPosition)
    yPosition += 7
    doc.text(`Meta Jejum: ${userData.meta_jejum || 95} mg/dL`, 20, yPosition)
    yPosition += 7
    doc.text(`Meta Pós-prandial: ${userData.meta_pos_prandial || 140} mg/dL`, 20, yPosition)

    yPosition += 15
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Estatísticas Gerais', 20, yPosition)
    yPosition += 10
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    doc.text(`Total de Registros: ${statistics.total_registros || 0}`, 20, yPosition)
    yPosition += 7
    doc.text(`Média Geral: ${statistics.media_glicemia ? Math.round(statistics.media_glicemia) : 0} mg/dL`, 20, yPosition)
    yPosition += 7
    doc.text(`Valor Mínimo: ${statistics.min_glicemia || 0} mg/dL`, 20, yPosition)
    yPosition += 7
    doc.text(`Valor Máximo: ${statistics.max_glicemia || 0} mg/dL`, 20, yPosition)
    yPosition += 7
    doc.text(`Registros em Jejum: ${statistics.total_jejum || 0}`, 20, yPosition)
    yPosition += 7
    doc.text(`Registros Pós-prandial: ${statistics.total_pos_prandial || 0}`, 20, yPosition)
    if (statistics.media_jejum) {
      yPosition += 7
      doc.text(`Média Jejum: ${Math.round(statistics.media_jejum)} mg/dL`, 20, yPosition)
    }
    if (statistics.media_pos_prandial) {
      yPosition += 7
      doc.text(`Média Pós-prandial: ${Math.round(statistics.media_pos_prandial)} mg/dL`, 20, yPosition)
    }

    yPosition += 15
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Registros Detalhados', 20, yPosition)
    yPosition += 10
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFillColor(52, 73, 94)
    doc.rect(20, yPosition - 5, 170, 8, 'F')
    doc.text('Data', 22, yPosition)
    doc.text('Hora', 45, yPosition)
    doc.text('Valor', 65, yPosition)
    doc.text('Tipo', 80, yPosition)
    doc.text('Observações', 110, yPosition)
    yPosition += 10
    doc.setTextColor(52, 73, 94)

    glucoseRecords.forEach((record) => {
      if (yPosition > 280) {
        doc.addPage()
        yPosition = 20
      }
      const dataFormatada = format(new Date(record.data_medicao), 'dd/MM/yyyy', { locale: ptBR })
      const tipoPortugues = record.tipo_jejum === 'jejum' ? 'Jejum' : 'Pós-prandial'
      doc.text(dataFormatada, 22, yPosition)
      doc.text(record.hora_medicao, 45, yPosition)
      doc.text(`${record.valor_glicemia} mg/dL`, 65, yPosition)
      doc.text(tipoPortugues, 80, yPosition)
      if (record.observacoes) {
        const obsTruncada = record.observacoes.length > 30 ? record.observacoes.substring(0, 30) + '...' : record.observacoes
        doc.text(obsTruncada, 110, yPosition)
      }
      yPosition += 7
    })

    const dataAtual = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    doc.setFontSize(10)
    doc.setTextColor(127, 140, 141)
    doc.text(`Relatório gerado em ${dataAtual}`, 105, 290, { align: 'center' })
    doc.text('GlicoGest - Monitoramento Inteligente para Diabetes Gestacional', 105, 295, { align: 'center' })
    return doc
  }

  generateWeeklyReport(userData: any, weeklyData: any) {
    const doc = new jsPDF()
    doc.setFont('helvetica')
    doc.setFontSize(20)
    doc.setTextColor(44, 62, 80)
    doc.text('Relatório Semanal de Glicemia', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    let yPosition = 35
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Dados do Paciente', 20, yPosition)
    yPosition += 10
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    doc.text(`Nome: ${userData.nome || 'Não informado'}`, 20, yPosition)
    yPosition += 7
    doc.text(`Período: ${weeklyData.startDate} a ${weeklyData.endDate}`, 20, yPosition)

    yPosition += 20
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Resumo da Semana', 20, yPosition)
    yPosition += 15
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const barWidth = 20
    const barSpacing = 5
    const startX = 30
    const maxBarHeight = 60
    const maxValue = Math.max(...weeklyData.dailyAverages.map((d: any) => d.media || 0), 1)
    weeklyData.dailyAverages.forEach((dia: any, index: number) => {
      const x = startX + index * (barWidth + barSpacing)
      const barHeight = dia.media ? (dia.media / maxValue) * maxBarHeight : 0
      const y = yPosition + maxBarHeight - barHeight
      doc.setFillColor(52, 152, 219)
      doc.rect(x, y, barWidth, barHeight, 'F')
      doc.setFontSize(8)
      doc.setTextColor(44, 62, 80)
      if (dia.media) {
        doc.text(Math.round(dia.media).toString(), x + barWidth / 2, y - 2, { align: 'center' })
      }
      doc.text(diasSemana[index], x + barWidth / 2, yPosition + maxBarHeight + 5, { align: 'center' })
    })

    yPosition += maxBarHeight + 20
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    doc.text(`Média da semana: ${weeklyData.weeklyAverage ? Math.round(weeklyData.weeklyAverage) : 0} mg/dL`, 20, yPosition)
    const dataAtual = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    doc.setFontSize(10)
    doc.setTextColor(127, 140, 141)
    doc.text(`Relatório gerado em ${dataAtual}`, 105, 290, { align: 'center' })
    return doc
  }

  generateDoctorReport(userData: any, period: { startDate: string; endDate: string }, glucose: { records: any[]; statistics: any }, nutritionDays: Array<{ date: string; summary: any; hydration: any; adequacao: any }>) {
    const doc = new jsPDF()
    doc.setFont('helvetica')
    doc.setFontSize(20)
    doc.setTextColor(44, 62, 80)
    doc.text('Relatório Clínico - GlicoGest', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    let y = 35
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Dados do Paciente', 20, y)
    y += 10
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    doc.text(`Nome: ${userData.nome || 'Não informado'}`, 20, y)
    y += 7
    doc.text(`Período: ${period.startDate} a ${period.endDate}`, 20, y)

    y += 15
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Resumo de Glicemia', 20, y)
    y += 10
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    const gs = glucose.statistics || {}
    doc.text(`Registros: ${gs.total_registros || 0}`, 20, y)
    y += 7
    doc.text(`Média: ${gs.media_glicemia ? Math.round(gs.media_glicemia) : 0} mg/dL`, 20, y)
    y += 7
    doc.text(`Mín/Máx: ${gs.min_glicemia || 0} / ${gs.max_glicemia || 0} mg/dL`, 20, y)

    y += 12
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Resumo Nutricional (adequação média)', 20, y)
    y += 10
    const totals = nutritionDays.reduce((acc: any, d) => {
      const a = d.adequacao || {}
      acc.ferro = (acc.ferro || 0) + (a.ferro || 0)
      acc.folato = (acc.folato || 0) + (a.folato || 0)
      acc.calcio = (acc.calcio || 0) + (a.calcio || 0)
      acc.hidr = (acc.hidr || 0) + (a.hidratacao || 0)
      return acc
    }, {})
    const days = nutritionDays.length || 1
    const avg = {
      ferro: Math.round((totals.ferro || 0) / days),
      folato: Math.round((totals.folato || 0) / days),
      calcio: Math.round((totals.calcio || 0) / days),
      hidr: Math.round((totals.hidr || 0) / days),
    }
    doc.setFontSize(12)
    doc.setTextColor(52, 73, 94)
    doc.text(`Ferro: ${avg.ferro}%  •  Folato: ${avg.folato}%  •  Cálcio: ${avg.calcio}%  •  Hidratação: ${avg.hidr}%`, 20, y)

    y += 15
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Tendência de Glicemia', 20, y)
    y += 8
    const agg: Record<string, { s: number; c: number }> = {}
    (glucose.records || []).forEach((r: any) => {
      const d = typeof r.data_medicao === 'string' ? r.data_medicao.slice(0, 10) : r.data_medicao
      if (!agg[d]) agg[d] = { s: 0, c: 0 }
      agg[d].s += r.valor_glicemia
      agg[d].c += 1
    })
    const series = Object.keys(agg).sort().map((d) => ({ d, v: agg[d].s / agg[d].c }))
    const cx = 20
    const cy = y + 60
    const cw = 170
    const ch = 60
    doc.setDrawColor(200, 200, 200)
    doc.rect(cx, y, cw, ch)
    if (series.length > 1) {
      const maxV = Math.max(...series.map((p) => p.v)) || 1
      const minV = Math.min(...series.map((p) => p.v)) || 0
      const range = Math.max(maxV - minV, 1)
      const step = cw / (series.length - 1)
      doc.setDrawColor(52, 152, 219)
      for (let i = 0; i < series.length - 1; i++) {
        const x1 = cx + i * step
        const y1 = y + ch - ((series[i].v - minV) / range) * ch
        const x2 = cx + (i + 1) * step
        const y2 = y + ch - ((series[i + 1].v - minV) / range) * ch
        doc.line(x1, y1, x2, y2)
      }
    }
    y = cy + 15

    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Adequação média por nutriente', 20, y)
    y += 10
    const bars = [
      { label: 'Ferro', value: avg.ferro, color: [244, 63, 94] },
      { label: 'Folato', value: avg.folato, color: [16, 185, 129] },
      { label: 'Cálcio', value: avg.calcio, color: [236, 72, 153] },
      { label: 'Hidratação', value: avg.hidr, color: [20, 184, 166] },
    ]
    bars.forEach((b) => {
      doc.setTextColor(52, 73, 94)
      doc.setFontSize(10)
      doc.text(`${b.label} ${Math.min(100, Math.max(0, b.value))}%`, 22, y)
      doc.setDrawColor(220, 220, 220)
      doc.rect(70, y - 4, 120, 6)
      const w = Math.max(0, Math.min(120, (b.value / 100) * 120))
      doc.setFillColor(b.color[0], b.color[1], b.color[2])
      doc.rect(70, y - 4, w, 6, 'F')
      y += 10
    })

    y += 15
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Hidratação diária', 20, y)
    y += 8
    const hSeries = nutritionDays.map((d) => ({ d: d.date, p: Math.min(100, Math.round(((d.hydration?.total_ml || 0) / 2300) * 100)) }))
    doc.setDrawColor(200, 200, 200)
    doc.rect(20, y, 170, 60)
    if (hSeries.length > 1) {
      const step = 170 / (hSeries.length - 1)
      doc.setDrawColor(20, 184, 166)
      for (let i = 0; i < hSeries.length - 1; i++) {
        const x1 = 20 + i * step
        const y1 = y + 60 - (Math.max(0, Math.min(100, hSeries[i].p)) / 100) * 60
        const x2 = 20 + (i + 1) * step
        const y2 = y + 60 - (Math.max(0, Math.min(100, hSeries[i + 1].p)) / 100) * 60
        doc.line(x1, y1, x2, y2)
      }
    }
    y += 75

    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Adequação diária por nutriente', 20, y)
    y += 10
    const dayBars = nutritionDays.map((d) => ({
      label: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
      ferro: Math.min(100, d.adequacao?.ferro ?? 0),
      folato: Math.min(100, d.adequacao?.folato ?? 0),
      calcio: Math.min(100, d.adequacao?.calcio ?? 0),
    }))
    dayBars.forEach((db) => {
      if (y > 280) { doc.addPage(); y = 20 }
      doc.setFontSize(10)
      doc.setTextColor(52, 73, 94)
      doc.text(db.label, 22, y)
      doc.setDrawColor(220, 220, 220)
      doc.rect(50, y - 4, 120, 6)
      doc.setFillColor(244, 63, 94)
      doc.rect(50, y - 4, Math.max(0, Math.min(120, (db.ferro / 100) * 120)), 6, 'F')
      y += 8
      doc.setTextColor(52, 73, 94)
      doc.text('Folato', 22, y)
      doc.setDrawColor(220, 220, 220)
      doc.rect(50, y - 4, 120, 6)
      doc.setFillColor(16, 185, 129)
      doc.rect(50, y - 4, Math.max(0, Math.min(120, (db.folato / 100) * 120)), 6, 'F')
      y += 8
      doc.setTextColor(52, 73, 94)
      doc.text('Cálcio', 22, y)
      doc.setDrawColor(220, 220, 220)
      doc.rect(50, y - 4, 120, 6)
      doc.setFillColor(236, 72, 153)
      doc.rect(50, y - 4, Math.max(0, Math.min(120, (db.calcio / 100) * 120)), 6, 'F')
      y += 10
    })

    y += 15
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Registros de Glicemia (últimos)', 20, y)
    y += 10
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFillColor(52, 73, 94)
    doc.rect(20, y - 5, 170, 8, 'F')
    doc.text('Data', 22, y)
    doc.text('Hora', 45, y)
    doc.text('Valor', 65, y)
    doc.text('Tipo', 80, y)
    doc.text('Obs.', 110, y)
    y += 10
    doc.setTextColor(52, 73, 94)
    const recent = (glucose.records || []).slice(0, 20)
    recent.forEach((r: any) => {
      if (y > 280) { doc.addPage(); y = 20 }
      const dt = format(new Date(r.data_medicao), 'dd/MM/yyyy', { locale: ptBR })
      doc.text(dt, 22, y)
      doc.text(r.hora_medicao, 45, y)
      doc.text(`${r.valor_glicemia} mg/dL`, 65, y)
      doc.text(r.tipo_jejum === 'jejum' ? 'Jejum' : 'Pós', 80, y)
      if (r.observacoes) doc.text((r.observacoes.length > 20 ? r.observacoes.substring(0, 20) + '...' : r.observacoes), 110, y)
      y += 7
    })

    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text('Resumo Nutricional por dia', 20, y)
    y += 10
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFillColor(52, 73, 94)
    doc.rect(20, y - 5, 170, 8, 'F')
    doc.text('Data', 22, y)
    doc.text('Energia', 45, y)
    doc.text('Prot', 70, y)
    doc.text('Gord', 90, y)
    doc.text('Carb', 110, y)
    doc.text('Ferro%', 130, y)
    doc.text('Folato%', 150, y)
    doc.text('Cálcio%', 170, y)
    y += 10
    doc.setTextColor(52, 73, 94)
    nutritionDays.forEach((d) => {
      if (y > 280) { doc.addPage(); y = 20 }
      doc.text(format(new Date(d.date), 'dd/MM', { locale: ptBR }), 22, y)
      const s = d.summary || {}
      doc.text(String(Math.round(s.energia_kcal || 0)), 45, y)
      doc.text(String(Number(s.proteina_g || 0).toFixed(1)), 70, y)
      doc.text(String(Number(s.gordura_g || 0).toFixed(1)), 90, y)
      doc.text(String(Number(s.carboidrato_g || 0).toFixed(1)), 110, y)
      const a = d.adequacao || {}
      doc.text(String(a.ferro ?? 0), 130, y)
      doc.text(String(a.folato ?? 0), 150, y)
      doc.text(String(a.calcio ?? 0), 170, y)
      y += 7
    })

    const dataAtual = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    doc.setFontSize(10)
    doc.setTextColor(127, 140, 141)
    doc.text(`Relatório gerado em ${dataAtual}`, 105, 290, { align: 'center' })
    return doc
  }
}

export default new PDFService()