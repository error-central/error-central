<?php

$_POST = json_decode(file_get_contents("php://input"), true);

echo $_POST['data1'];

// So sorry for the PHP.  :(

$servername = "localhost";
$username = "wanderin_ec";
$password = "";
$database = "wanderin_ec";

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$stmt = $conn->prepare("INSERT INTO errors (sessionId, userName, blobId, date, language, title, rawText) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param(
    'dsdssss',
    $_POST['sessionId'],
    $_POST['userName'],
    $_POST['blobId'],
    $_POST['date'],
    $_POST['language'],
    $_POST['title'],
    $_POST['rawText']
);
if ($stmt->execute() === TRUE) {
    echo "{success: 1}";
    print_r($_POST);
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

?>
