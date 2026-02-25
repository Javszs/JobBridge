import { useState, FormEvent, ChangeEvent } from "react";
import { supabase } from "../supabaseClient";
import {
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonLabel,
  IonToast,
} from "@ionic/react";
import { eye, eyeOff } from "ionicons/icons";
import { useHistory } from "react-router";

interface AuthProps {
  onSignUpClick?: () => void;
  onLogin?: () => void;
}

export const Auth = ({ onSignUpClick, onLogin }: AuthProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");
  const history = useHistory();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSignUp) {
      if (password !== confirmPassword) {
        setToastMessage("Passwords do not match");
        setToastColor("danger");
        setShowToast(true);
        return;
      }

      setToastMessage("Email sent for verification");
      setToastColor("success");
      setShowToast(true);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setToastMessage("Error signing up: " + signUpError.message);
        setToastColor("danger");
        setShowToast(true);
        return;
      }
    } else {
      setToastMessage("Logging in");
      setToastColor("success");
      setShowToast(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setToastMessage("Wrong Email or Password");
        setToastColor("danger");
        setShowToast(true);
        return;
      } else {
        // Successful login, navigate to home
        onLogin?.();
        history.replace('/tabs/Home');
      }
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp(!isSignUp);
    onSignUpClick?.();
  };

  return (
    <>
      <div className="form-card">
        <h2 style={{ textAlign: "center", marginBottom: "30px", fontWeight: "600", color: "black" }}>
          {isSignUp ? "SIGN UP" : "LOGIN"}
        </h2>
        <form onSubmit={handleSubmit}>
          <IonItem lines="full" style={{
              "--background": "white",
                height: "50px",
                "--color": "black",
                border: "1.5px solid #000000ff",
                borderRadius: "20px",
              }}>
            <IonInput
              type="email"
              value={email}
              onIonChange={(e) =>
                setEmail(e.detail.value!)
              }
              placeholder="Email"
              clearInput
            />
          </IonItem>

          <IonItem lines="full" style={{
              marginTop: "20px",
              "--background": "white",
              height: "50px",
              "--color": "black",
              border: "1.5px solid #000000ff",
              borderRadius: "20px",
            }}>
            <IonInput
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="Password"
              onIonChange={(e) =>
                setPassword(e.detail.value!)
              }
              clearInput
            />
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setShowPassword(!showPassword)}
            >
              <IonIcon icon={showPassword ? eye : eyeOff} />
            </IonButton>
          </IonItem>

          {isSignUp && (
            <IonItem lines="full" style={{
                marginTop: "20px",
                "--background": "white",
                height: "50px",
                "--color": "black",
                border: "1.5px solid #000000ff",
                borderRadius: "20px",
              }}>
              <IonInput
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                placeholder="Confirm Password"
                onIonChange={(e) =>
                  setConfirmPassword(e.detail.value!)
                }
                clearInput
              />
            </IonItem>
          )}

          <IonButton
            type="submit"
            expand="block"
            shape="round"
            style={{
              marginTop: "30px",
              "--background": "linear-gradient(135deg, #eadf66ff 0%, #ada777ff 100%)",
              "--border-radius": "50px",
              height: "50px",
              "--color": "white",
              fontWeight: "bold",
            } as any}
          >
            <strong>{isSignUp ? "Sign Up" : "Log In"}</strong>
          </IonButton>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            type="button"
            onClick={handleSwitchMode}
            style={{
              marginTop: "25px",
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
              textDecoration: "underline",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.color = "#667eea")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.color = "#667eea")
            }
          >
            {isSignUp
              ? "Already have an account? Log In!"
              : "Not a member yet? Sign Up!"}
          </button>
        </div>
      </div>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
      />
    </>
  );
};