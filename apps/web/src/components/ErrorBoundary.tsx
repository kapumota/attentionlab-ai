import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  title: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  detailsVisible: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    detailsVisible: false
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Attentio] Error en ${this.props.title}`, error, info.componentStack);
  }

  retry = () => {
    this.setState({ hasError: false, error: null, detailsVisible: false });
  };

  toggleDetails = () => {
    this.setState((current) => ({ detailsVisible: !current.detailsVisible }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="panel error-boundary" role="alert">
        <p className="eyebrow">Frontera de error React</p>
        <h2>{this.props.title}</h2>
        <p>
          Este módulo encontró un error de renderizado. Puedes seguir usando el resto del panel mientras revisas este bloque.
        </p>
        <div className="error-boundary-actions">
          <button type="button" onClick={this.retry}>Reintentar</button>
          <button type="button" className="secundario" onClick={this.toggleDetails}>
            {this.state.detailsVisible ? "Ocultar detalles técnicos" : "Ver detalles técnicos"}
          </button>
        </div>
        {this.state.detailsVisible && (
          <pre className="salida-json">{this.state.error?.message ?? "Error desconocido"}</pre>
        )}
      </section>
    );
  }
}
