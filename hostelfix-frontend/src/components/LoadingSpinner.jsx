import "./Spinner.css";

export default function LoadingSpinner({ size = "medium", text = "" }) {
  return (
    <div className={`spinnerWrapper ${size}`}>
      <div className="spinner" />
      {text && <p className="spinnerText">{text}</p>}
    </div>
  );
}
