<?php
header('Content-Type: application/json');

// --- CONFIGURATION ---
// L'adresse email où vous souhaitez recevoir les messages.
// IMPORTANT : Pour que la fonction mail() de PHP fonctionne, l'hébergeur
// peut exiger que l'expéditeur soit une adresse du même domaine.
$recipient_email = "contact@conception-ea.fr";

// --- SCRIPT ---

// Vérifie que la requête est bien de type POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée.']);
    exit;
}

// Récupère et nettoie les données du formulaire
$name = htmlspecialchars(trim($_POST['name'] ?? ''), ENT_QUOTES, 'UTF-8');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$subject = htmlspecialchars(trim($_POST['subject'] ?? ''), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');

// Validation côté serveur (essentiel pour la sécurité)
if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Veuillez remplir tous les champs requis.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Veuillez fournir une adresse email valide.']);
    exit;
}

// Construction de l'email
$email_subject = "Nouveau message du site CEA : " . $subject;

$email_body = "Vous avez reçu un nouveau message depuis le formulaire de contact de votre site.\n\n";
$email_body .= "Nom: $name\n";
$email_body .= "Email: $email\n";
$email_body .= "Sujet: $subject\n\n";
$email_body .= "Message:\n$message\n";

// Entêtes de l'email
// L'entête "From" est souvent plus fiable s'il provient du même domaine que le site.
$headers = "From: no-reply@" . ($_SERVER['SERVER_NAME'] ?? 'conception-ea.fr') . "\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Envoi de l'email
if (mail($recipient_email, $email_subject, $email_body, $headers)) {
    // Succès
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Message envoyé avec succès !']);
} else {
    // Échec
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => 'error', 'message' => 'Une erreur est survenue lors de l\'envoi de l\'email.']);
}
?>