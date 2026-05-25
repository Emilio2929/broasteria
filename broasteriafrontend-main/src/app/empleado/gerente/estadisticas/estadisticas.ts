import { ViewEncapsulation, Component, OnInit,ChangeDetectorRef  } from '@angular/core';
import { Router } from '@angular/router';
import { GerenteService } from '../../../services/gerente.service';
import { EmpleadoService } from '../../../services/empleado.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var Chart: any;
declare var echarts: any;
declare var flatpickr: any;

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class Estadisticas implements OnInit{
  chartCircular: any;
  chartBarras: any;
  chartComparacion: any;

    //modificaaa
  mostrarModal = false;
  modalTitulo = '';
  modalMensaje = '';
  modalTipo: 'success' | 'error' | 'confirm' = 'success';
  modalAccion: 'cerrarSesion' | null = null;
  mostrarMasVendidos = false;

  //Filtrado de fechas
  mes1 = new Date().getMonth() + 1;
  anio1 = new Date().getFullYear();
  mes2 = new Date().getMonth() + 1;
  anio2 = new Date().getFullYear();

  fechaInicioSeleccionada: Date = new Date();
  fechaFinSeleccionada: Date = new Date();

  flatInicio: any;
  flatFin: any;

  mesesdisponibles: { nombre: string, valor: number }[] = [];
  aniosdisponibles: number[] = [];
  

  constructor(
    private router: Router,
    private gerenteService: GerenteService,
    private empleadoService: EmpleadoService,
    private cd: ChangeDetectorRef
  ) {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();
    // Mes anterior
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    // Compracion
    this.mes1 = mesAnterior;
    this.anio1 = anioAnterior;

    this.mes2 = mesActual;
    this.anio2 = anioActual;
  }
  
  ngOnInit(): void {

    window.addEventListener('resize', () => {
      this.chartCircular?.resize();
      this.chartBarras?.resize();
      this.chartComparacion?.resize();
    });

    this.cargarCalendario();
    this.cargarMesesYAnioDisponibles();
    this.actualizarDatos();
    setInterval(()=> {
        this.actualizarDatos();
      },1800000)
  }

  actualizarDatos() {
    this.cargarPedidos();
    this.crearGraficoCircular();
    this.crearGraficoBarras();
    this.cargarComparacion();
  }

  private getRangoFechas() {
    const inicio = new Date(this.fechaInicioSeleccionada);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(this.fechaFinSeleccionada);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  private formatoFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0]; 
  }

  cargarCalendario() {
    this.flatInicio = flatpickr("#datepickerInicio", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      allowInput: false,
      locale: "es",
      defaultDate: this.fechaInicioSeleccionada,
      maxDate: this.fechaFinSeleccionada,
      onChange: (selectedDates: any) => {
        if (selectedDates.length > 0) {
          this.fechaInicioSeleccionada = selectedDates[0];

          this.flatFin.set("minDate", this.fechaInicioSeleccionada);

          this.actualizarDatos();
        }
      },
      onReady: function (_: any, __: any, instance: any) {
        const fp = instance.calendarContainer;

        fp.style.width = "340px";  
        fp.style.borderRadius = "20px";
        fp.style.padding = "15px";
        fp.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        fp.style.background = "white";
        fp.style.transform = "scale(0.95)";
        fp.style.transition = "all 0.25s ease";

        fp.addEventListener("mouseenter", () => {
          fp.style.transform = "scale(1)";
        });

        fp.addEventListener("mouseleave", () => {
          fp.style.transform = "scale(0.95)";
        });
      }
    });
    this.flatFin = flatpickr("#datepickerFin", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      allowInput: false,
      maxDate: "today",
      locale: "es",
      defaultDate: this.fechaFinSeleccionada,
      minDate: this.fechaInicioSeleccionada,
      onChange: (selectedDates: any) => {
        if (selectedDates.length > 0) {
          this.fechaFinSeleccionada = selectedDates[0];
          this.flatInicio.set("maxDate", this.fechaFinSeleccionada);
        }
      },
            onReady: function (_: any, __: any, instance: any) {
        const fp = instance.calendarContainer;
        
        fp.style.width = "340px";    
        fp.style.borderRadius = "20px";
        fp.style.padding = "15px";
        fp.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        fp.style.background = "white";
        fp.style.transform = "scale(0.95)";
        fp.style.transition = "all 0.25s ease";

        fp.addEventListener("mouseenter", () => {
          fp.style.transform = "scale(1)";
        });

        fp.addEventListener("mouseleave", () => {
          fp.style.transform = "scale(0.95)";
        });
      }
    });
  }

  cargarPedidos() {
    const tabla = document.getElementById('tablaPedidos');
    if (!tabla) return;
    tabla.innerHTML = '';
    let sumaTotal = 0;

    const { inicio, fin } = this.getRangoFechas();
    const inicioStr = this.formatoFecha(inicio);
    const finStr = this.formatoFecha(fin);

    this.gerenteService.listarPedidos(inicioStr,finStr).subscribe({
      next: (pedidos) => {
        console.log('Datos circular:', pedidos);

        if (!pedidos || pedidos.length === 0) {
          tabla.innerHTML =
            '<tr><td colspan="6" class="text-center text-muted">No hay pedidos pendientes.</td></tr>';
          
          const tfoot = document.querySelector('table tfoot');
          if (tfoot) {
            tfoot.innerHTML = `
              <tr>
                <td colspan="3" class="text-end fw-bold">Total General:</td>
                <td class="fw-bold">S/ 0.00</td>
              </tr>
            `;
          }
          return;
        }

        pedidos.sort((a: any, b: any) => b.id - a.id);
        sumaTotal = pedidos.reduce((acc: number, p: any) => acc + p.totalPedido, 0);

        const ultimosDiez = pedidos.slice(0, 10);
        ultimosDiez.forEach((pedido) => {
          const fila = document.createElement('tr');          
          fila.innerHTML = `
            <td>#${pedido.id}</td>
            <td>${pedido.cliente?.nombre || 'Desconocido'} ${pedido.cliente?.apellido || ''}</td>
            <td>${new Date(pedido.fechaPedido).toLocaleString()}</td>
            <td><strong>S/ ${pedido.totalPedido.toFixed(2)}</strong></td>
          `;
          tabla.appendChild(fila);
        });

        const tfoot = document.querySelector('table tfoot');
        if (tfoot) {
          tfoot.innerHTML = `
            <tr>
              <td colspan="3" class="text-end fw-bold">Total General:</td>
              <td class="fw-bold">S/ ${sumaTotal.toFixed(2)}</td>
            </tr>
          `;
        }
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        tabla.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar los pedidos.</td></tr>`;
      },
    });
  }

  CambioOrdenMV() {
    this.mostrarMasVendidos = !this.mostrarMasVendidos;
    this.crearGraficoCircular();
  }

  coloresBase = [
    "#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe",
    "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080",
    "#FFFFFF", "#000000", "#4363d8", "#bcf60c", "#9a6324",
    "#469990", "#dcbeff", "#e6d8ae", "#a9a9a9", "#ffe4e1",
    "#7fffd4", "#ff69b4", "#cd5c5c", "#20b2aa", "#ffdead"
  ];
  mapaColores: { [producto: string]: string } = {};

  

  crearGraficoCircular() {
    const dom = document.getElementById('graficoCircular');
    if (!dom) return;

    const { inicio, fin } = this.getRangoFechas();
    const inicioStr = this.formatoFecha(inicio);
    const finStr = this.formatoFecha(fin);

    const orden = this.mostrarMasVendidos
      ? this.gerenteService.ProMasVent(inicioStr, finStr)
      : this.gerenteService.ProMenosVent(inicioStr, finStr);

    orden.subscribe({
      next: (data) => {

        console.log('Datos circular:', data);

        const labels = data.map((d: any) => d.producto);
        const valores = data.map((d: any) => d.cantidad);

        labels.forEach((producto, i) => {
          if (!this.mapaColores[producto]) {
            this.mapaColores[producto] = this.coloresBase[i % this.coloresBase.length];
          }
        });

        if (this.chartCircular) {
          this.chartCircular.dispose();
        }

        this.chartCircular = echarts.init(dom);

        const option = {
          tooltip: {
            trigger: 'item'
          },
          legend: {
            orient: 'horizontal',   
            top: '0%',

          },
          series: [
            { 
              top: '10%',
              name: 'Cantidad',
              type: 'pie',
              radius: '70%',
              data: labels.map((label, index) => ({
                name: label,
                value: valores[index],
                itemStyle: { color: this.mapaColores[label] }
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        };
        
        this.chartCircular.setOption(option);
        this.chartCircular.on('click', (params: any) => {
          const productoSeleccionado = params.name;
          this.crearGraficoBarras(productoSeleccionado);
        });
      },
      error: (err) => console.error('Error al cargar gráfico circular:', err)
    });
  }

  productoSeleccionadoActual: string | null = null;

  crearGraficoBarras(producto?: string) {
    const ctx = document.getElementById('graficoBarras') as HTMLCanvasElement;
    if (!ctx) return;

    const { inicio, fin } = this.getRangoFechas();
    const inicioStr = this.formatoFecha(inicio);
    const finStr = this.formatoFecha(fin);

    if (producto && producto === this.productoSeleccionadoActual) {
      producto = undefined;
      this.productoSeleccionadoActual = null;
    } else {
      this.productoSeleccionadoActual = producto || null;
    }

    this.gerenteService.ventaPorProducto(inicioStr, finStr).subscribe({
      next: (data: any[]) => {
        console.log('Datos circular:', data);
        let datosFiltrados = producto ? data.filter(d => d.producto === producto) : data;
        const labels = datosFiltrados.map(d => d.producto);
        const valores = datosFiltrados.map(d => d.totalGanancia);

        labels.forEach((producto, i) => {
          if (!this.mapaColores[producto]) {
            this.mapaColores[producto] = this.coloresBase[i % this.coloresBase.length];
          }
        });

        const backgroundColors = labels.map(label => this.mapaColores[label] || '#ccc');

        if (this.chartBarras) {

          this.chartBarras.data.labels = labels;
          this.chartBarras.data.datasets[0].data = valores;
          this.chartBarras.data.datasets[0].backgroundColor = backgroundColors;
          this.chartBarras.update();
          
        }
        this.chartBarras = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Ventas por Producto',
              data: valores,
              backgroundColor: backgroundColors,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Soles (S/)' }
              }
            },
            plugins: {
              legend: { display: true, position: 'top' },
              title: { display: true, text: 'Ventas por Producto' }
            }
          }
        });
      },
      error: (err) => console.error('Error al cargar gráfico de barras:', err)
    });
  }

  obtenerNombreMes(mes: number): string {
    const nombres = [
      'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
    ];
    return nombres[mes - 1] || '';
  }

  cargarMesesYAnioDisponibles() {
    this.gerenteService.anioymesActual().subscribe({
      next: (res: any[][]) => {
        console.log("Meses y Años desde DB:", res);
        this.mesesdisponibles = res.map(r => ({
          nombre: this.obtenerNombreMes(r[1]), 
          valor: r[1]
        }));
        this.aniosdisponibles = Array.from(new Set(res.map(r => r[0]))); 
        if (!this.mes1) {
          this.mes1 = this.mesesdisponibles[0]?.valor;
        }
        if (!this.anio1) {
          this.anio1 = this.aniosdisponibles[0];
        }

        if (!this.mes2) {
          this.mes2 = this.mesesdisponibles[this.mesesdisponibles.length - 1]?.valor;
        }
        if (!this.anio2) {
          this.anio2 = this.aniosdisponibles[this.aniosdisponibles.length - 1];
        }

        this.cd.detectChanges();

      },
      error: (err) => console.error('Error cargando meses/Años disponibles', err)
    });
  }

  cargarComparacion() {
    const dom = document.getElementById('graficoComparacion');
    if (!dom) return;

    this.gerenteService.ComparacionVentasMensuales(
      this.mes1, this.anio1, this.mes2, this.anio2
    ).subscribe({
      next: (resp) => {

        console.log("RESPUESTA:", resp);

        const datasetMes1 = resp.DPL.map((d: any[]) => ({
          dia: d[0],
          total: d[1]
        }));

        const datasetMes2 = resp.DSL.map((d: any[]) => ({
          dia: d[0],
          total: d[1]
        }));

        const nombreMes1 = this.obtenerNombreMes(this.mes1);
        const nombreMes2 = this.obtenerNombreMes(this.mes2);

        if (this.chartComparacion) {
          this.chartComparacion.dispose();
        }

        this.chartComparacion = echarts.init(dom);

        const option = {
          title: {
            text: `Comparación: ${nombreMes1} vs ${nombreMes2}`
          },
          tooltip: {
            trigger: 'axis',
          },
          dataset: [
            {
              id: 'dataset_mes1',
              source: datasetMes1
            },
            {
              id: 'dataset_mes2',
              source: datasetMes2
            }
          ],
          xAxis: {
            type: 'value',
            name: 'Dí­a',
            min: 1,
            axisLabel: { formatter: '{value}'},
            axisPointer: {
              label: {
                formatter: (params: any) => `Dí­a: ${params.value}`
              }
            }
          },
          yAxis: {
            name: 'Ganancia (S/.)'
          },
          series: [
            {
              type: 'line',
              datasetId: 'dataset_mes1',
              showSymbol: true,
              name: nombreMes1,
              encode: {
                x: 'dia',
                y: 'total',
                tooltip: ['total']
              }
            },
            {
              type: 'line',
              datasetId: 'dataset_mes2',
              showSymbol: true,
              name: nombreMes2,
              encode: {
                x: 'dia',
                y: 'total',
                tooltip: ['total']
              }
            }
          ]
        };

        this.chartComparacion.setOption(option);
      },
      error: (err) => console.error('Error al cargar comparación', err)
    });
  }

  mostrarAlertaCerrarSesion() {
    this.modalTipo = 'confirm';
    this.modalTitulo = 'Confirmar Cierre';
    this.modalMensaje = '¿Estás seguro de que deseas cerrar sesión?';
    this.modalAccion = 'cerrarSesion';
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modalAccion = null;
  }

  ejecutarAccion() {
    if (this.modalAccion === 'cerrarSesion') {

      this.empleadoService.logoutBackend().subscribe({
        next: () => {
          this.empleadoService.logout();
          this.cerrarModal();
          this.router.navigate(['/empleado']);
        },
        error: () => {
          this.empleadoService.logout();
          this.cerrarModal();
          this.router.navigate(['/empleado']);
        }
      });

    }
    
  }

  CerrarSesion(event: Event) {
    event.preventDefault();
    this.mostrarAlertaCerrarSesion();
  }

  empleados(event: Event) {event.preventDefault(); this.router.navigate(['/gerente']);}
  inventario(event: Event) {event.preventDefault(); this.router.navigate(['/inventario']);}
  estadistica(event: Event) {event.preventDefault(); this.router.navigate(['/estadisticas']);}
}