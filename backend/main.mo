import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";



actor {
  include MixinStorage();

  type Score = {
    name : Text;
    notes : [Note];
    lyrics : ?Text;
  };

  type Note = {
    pitch : Text; // e.g., "C5", "G#5"
    duration : Nat; // Milliseconds
    fingering : [Text]; // Ocarina finger positions
  };

  type PresetSong = {
    id : Text;
    displayName : Text;
    score : Score;
  };

  type SampleAssignment = {
    note : Text;
    blob : Storage.ExternalBlob;
  };

  let scores = Map.empty<Text, Score>();
  let presetSongs = Map.empty<Text, PresetSong>();
  let customSamples = Map.empty<Text, Storage.ExternalBlob>();
  let fingeringMap = Map.empty<Text, [Bool]>();

  public shared ({ caller }) func saveScore(name : Text, score : Score) : async () {
    scores.add(name, score);
  };

  public query ({ caller }) func getScore(name : Text) : async Score {
    switch (scores.get(name)) {
      case (?score) { score };
      case (null) { Runtime.trap("Score not found") };
    };
  };

  public query ({ caller }) func getAllScores() : async [Score] {
    scores.values().toArray();
  };

  public shared ({ caller }) func uploadSample(note : Text, blob : Storage.ExternalBlob) : async () {
    customSamples.add(note, blob);
  };

  public query ({ caller }) func getSampleAssignment(note : Text) : async ?Storage.ExternalBlob {
    customSamples.get(note);
  };

  public query ({ caller }) func getAllSampleAssignments() : async [SampleAssignment] {
    customSamples.entries().toArray().map(
      func((note, blob)) { { note; blob } }
    );
  };

  public query ({ caller }) func getPresetSongList() : async [{
    id : Text;
    displayName : Text;
  }] {
    presetSongs.values().toArray().map(
      func(song) { { id = song.id; displayName = song.displayName } }
    );
  };

  public query ({ caller }) func getPresetSong(id : Text) : async PresetSong {
    switch (presetSongs.get(id)) {
      case (?song) { song };
      case (null) { Runtime.trap("Preset song not found") };
    };
  };

  public shared ({ caller }) func addPresetSong(id : Text, displayName : Text, score : Score) : async () {
    let song = {
      id;
      displayName;
      score;
    };
    presetSongs.add(id, song);
  };

  public shared ({ caller }) func deleteScore(name : Text) : async () {
    if (scores.containsKey(name)) {
      scores.remove(name);
    } else {
      Runtime.trap("Score not found");
    };
  };

  public shared ({ caller }) func deleteSampleAssignment(note : Text) : async () {
    if (customSamples.containsKey(note)) {
      customSamples.remove(note);
    } else {
      Runtime.trap("Sample assignment not found");
    };
  };

  public shared ({ caller }) func saveFingeringMap(newMap : [(Text, [Bool])]) : async () {
    let tempMap = Map.fromArray(newMap);
    fingeringMap.clear();
    let iter = tempMap.entries();
    for ((k, v) in iter) {
      fingeringMap.add(k, v);
    };
  };

  public query ({ caller }) func loadFingeringMap() : async [(Text, [Bool])] {
    fingeringMap.toArray();
  };
};
