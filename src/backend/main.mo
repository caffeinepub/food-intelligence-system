import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Text "mo:core/Text";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  type FoodAnalysis = {
    foodName : Text;
    freshnessLabel : Text;
    confidencePercent : Nat;
    statusMessage : Text;
    topPredictions : [Prediction];
    aiResponse : Text;
  };

  type Prediction = {
    name : Text;
    confidence : Nat;
  };

  type HistoryRecord = {
    id : Nat;
    foodName : Text;
    freshnessLabel : Text;
    confidencePercent : Nat;
    timestamp : Int;
    image : ?Storage.ExternalBlob;
  };

  module HistoryRecord {
    public func compare(a : HistoryRecord, b : HistoryRecord) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  let foods = [
    "Banana",
    "Apple",
    "Orange",
    "Strawberry",
    "Tomato",
    "Bread",
    "Lettuce",
    "Carrot",
    "Grape",
    "Mango",
  ];

  // Lowercase keywords for case-insensitive filename matching
  let foodKeywords = [
    "banana",
    "apple",
    "orange",
    "strawberry",
    "tomato",
    "bread",
    "lettuce",
    "carrot",
    "grape",
    "mango",
  ];

  let predictions = [
    [
      { name = "Banana"; confidence = 90 },
      { name = "Apple"; confidence = 2 },
      { name = "Bread"; confidence = 8 },
    ],
    [
      { name = "Apple"; confidence = 85 },
      { name = "Tomato"; confidence = 10 },
      { name = "Mango"; confidence = 5 },
    ],
    [
      { name = "Orange"; confidence = 80 },
      { name = "Carrot"; confidence = 15 },
      { name = "Strawberry"; confidence = 5 },
    ],
    [
      { name = "Strawberry"; confidence = 93 },
      { name = "Apple"; confidence = 4 },
      { name = "Grape"; confidence = 3 },
    ],
    [
      { name = "Tomato"; confidence = 86 },
      { name = "Apple"; confidence = 8 },
      { name = "Strawberry"; confidence = 6 },
    ],
    [
      { name = "Bread"; confidence = 75 },
      { name = "Carrot"; confidence = 20 },
      { name = "Banana"; confidence = 5 },
    ],
    [
      { name = "Lettuce"; confidence = 90 },
      { name = "Carrot"; confidence = 7 },
      { name = "Grape"; confidence = 3 },
    ],
    [
      { name = "Carrot"; confidence = 92 },
      { name = "Banana"; confidence = 6 },
      { name = "Apple"; confidence = 2 },
    ],
    [
      { name = "Grape"; confidence = 88 },
      { name = "Strawberry"; confidence = 7 },
      { name = "Mango"; confidence = 5 },
    ],
    [
      { name = "Mango"; confidence = 90 },
      { name = "Banana"; confidence = 8 },
      { name = "Apple"; confidence = 2 },
    ],
  ];

  // Only fresh labels — aged/overripe/stale removed
  let freshnessLabels = [
    "Very Fresh",
    "Fresh",
  ];

  let thresholdMessages = [
    "This is a banana. It is fresh and ready to eat!",
    "This is an apple. It looks delicious and crisp!",
    "This is an orange. Enjoy it's juicy goodness!",
    "This is a strawberry. It's sweet and ready to eat!",
    "This is a tomato. It looks ripe and tasty!",
    "This is bread. It appears fresh and delicious!",
    "This is lettuce. It's crisp and perfect for salads!",
    "This is a carrot. It looks fresh and crunchy!",
    "This is a grape. Enjoy it's sweet and juicy taste!",
    "This is a mango. It looks ripe and delicious!",
  ];

  let foodAiResponses = [
    (
      "Banana",
      true,
      "AI: Bananas are a great source of potassium and vitamins! Perfect for a quick snack.",
    ),
    (
      "Apple",
      true,
      "AI: Apples are delicious and nutritious! Keep the doctor away with this tasty fruit.",
    ),
    (
      "Orange",
      true,
      "AI: Oranges are packed with vitamin C! Perfect for boosting your immune system.",
    ),
    (
      "Strawberry",
      true,
      "AI: Strawberries are sweet, juicy, and a fantastic source of antioxidants and vitamin C!",
    ),
    (
      "Tomato",
      true,
      "AI: Tomatoes are rich in vitamins and minerals. Perfect for salads or sandwiches.",
    ),
    (
      "Bread",
      true,
      "AI: Bread is a staple food in many cultures. Enjoy it fresh and delicious!",
    ),
    (
      "Lettuce",
      true,
      "AI: Lettuce is low in calories and a great source of hydration. Perfect for salads!",
    ),
    (
      "Carrot",
      true,
      "AI: Carrots are packed with vitamin A. Great for eye health and adding crunch to salads.",
    ),
    (
      "Grape",
      true,
      "AI: Grapes are a tasty, convenient snack with lots of healthy nutrients.",
    ),
    (
      "Mango",
      true,
      "AI: Mangoes are sweet, juicy, and a great source of vitamins and minerals!",
    ),
  ];

  var nextHistoryId = 1;
  let histories = Map.empty<Nat, HistoryRecord>();

  // Detect food index from hint text using lowercase keyword matching
  func detectFoodFromHint(hint : Text) : ?Nat {
    var i = 0;
    for (keyword in foodKeywords.vals()) {
      if (hint.contains(#text keyword)) {
        return ?i;
      };
      i += 1;
    };
    null;
  };

  public shared ({ caller }) func analyzeFood(imageSize : Nat, textQuery : Text) : async FoodAnalysis {
    let hintMatch = detectFoodFromHint(textQuery);
    let foodIndex = switch (hintMatch) {
      case (?idx) idx;
      case null { imageSize % foods.size() };
    };
    let foodName = foods[foodIndex];
    let freshnessLabelIndex = foodIndex % freshnessLabels.size();
    let freshnessLabel = freshnessLabels[freshnessLabelIndex];
    // Compute confidence safely to avoid Nat underflow
    let base : Nat = if (hintMatch != null) 93 else 85;
    let penalty : Nat = foodIndex % 15;
    let confidencePercent : Nat = if (base > penalty) base - penalty else base;
    let statusMessage = thresholdMessages[foodIndex];
    let topPredictions = predictions[foodIndex];
    var aiResponse = "Unknown Food";
    for ((name, _, response) in foodAiResponses.values()) {
      if (name == foodName) {
        aiResponse := response;
      };
    };
    {
      foodName;
      freshnessLabel;
      confidencePercent;
      statusMessage;
      topPredictions;
      aiResponse;
    };
  };

  public shared ({ caller }) func saveAnalysis(foodName : Text, freshnessLabel : Text, confidencePercent : Nat, image : ?Storage.ExternalBlob) : async () {
    if (foodName == "") {
      Runtime.trap("Food name cannot be empty. Please specify a food name.");
    };
    if (confidencePercent > 100) {
      Runtime.trap("Invalid confidence percent. Please use a value between 0-100.");
    };
    let timestamp = Time.now();
    let record : HistoryRecord = {
      id = nextHistoryId;
      foodName;
      freshnessLabel;
      confidencePercent;
      timestamp;
      image;
    };
    histories.add(nextHistoryId, record);
    nextHistoryId += 1;
  };

  public query ({ caller }) func getHistory() : async [HistoryRecord] {
    histories.values().toArray().sort();
  };
};
