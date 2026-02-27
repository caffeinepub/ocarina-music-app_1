import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
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
    pitch : Text;
    duration : Nat;
    fingering : [Text];
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

  public type SizePreset = {
    #lowBass;
    #bass;
    #alto;
    #soprano;
  };

  public type OcarinaProfile = {
    id : Text;
    name : Text;
    description : Text;
    category : Text;
    shape : Text;
    size : SizePreset;
    image : Storage.ExternalBlob;
  };

  type InternalOcarinaProfile = {
    id : Text;
    name : Text;
    description : Text;
    category : Text;
    shape : Text;
    size : SizePreset;
    image : Storage.ExternalBlob;
  };

  type OcarinaProfileForm = {
    name : Text;
    description : Text;
    category : Text;
    shape : Text;
    size : SizePreset;
  };

  let scores = Map.empty<Text, Score>();
  let presetSongs = Map.empty<Text, PresetSong>();
  let customSamples = Map.empty<Text, Storage.ExternalBlob>();
  let fingeringMap = Map.empty<Text, [Bool]>();
  let ocarinaProfiles = Map.empty<Text, InternalOcarinaProfile>();

  let creatorPasswordHash = "MTk5NjIwMjY=";

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

  public query ({ caller }) func getOcarinaProfiles() : async [OcarinaProfile] {
    ocarinaProfiles.toArray().map<(Text, InternalOcarinaProfile), OcarinaProfile>(
      func((_, internalProfile)) {
        {
          id = internalProfile.id;
          name = internalProfile.name;
          description = internalProfile.description;
          category = internalProfile.category;
          shape = internalProfile.shape;
          size = internalProfile.size;
          image = internalProfile.image;
        };
      }
    );
  };

  public query ({ caller }) func getOcarinaProfile(id : Text) : async OcarinaProfile {
    switch (ocarinaProfiles.get(id)) {
      case (?profile) {
        {
          id = profile.id;
          name = profile.name;
          description = profile.description;
          category = profile.category;
          shape = profile.shape;
          size = profile.size;
          image = profile.image;
        };
      };
      case (null) { Runtime.trap("Ocarina profile not found") };
    };
  };

  public shared ({ caller }) func createOcarinaProfile(id : Text, profileData : OcarinaProfileForm, image : Storage.ExternalBlob, password : Text) : async () {
    if (password.trim(#char(' ')) != creatorPasswordHash) {
      Runtime.trap("Invalid creator password");
    };

    let internalProfile = {
      id;
      name = profileData.name;
      description = profileData.description;
      category = profileData.category;
      shape = profileData.shape;
      size = profileData.size;
      image;
    };

    ocarinaProfiles.add(id, internalProfile);
  };

  public shared ({ caller }) func bulkCreateOcarinaProfiles(
    entries : [(Text, OcarinaProfileForm, Storage.ExternalBlob)],
    password : Text,
  ) : async () {
    if (password.trim(#char(' ')) != creatorPasswordHash) {
      Runtime.trap("Invalid creator password");
    };

    for ((id, profileData, image) in entries.values()) {
      let internalProfile = {
        id;
        name = profileData.name;
        description = profileData.description;
        category = profileData.category;
        shape = profileData.shape;
        size = profileData.size;
        image;
      };

      ocarinaProfiles.add(id, internalProfile);
    };
  };

  public shared ({ caller }) func updateOcarinaProfile(id : Text, updatedProfile : OcarinaProfileForm, image : ?Storage.ExternalBlob, password : Text) : async () {
    if (password.trim(#char(' ')) != creatorPasswordHash) {
      Runtime.trap("Invalid creator password");
    };

    switch (ocarinaProfiles.get(id)) {
      case (?existing) {
        let newProfile = {
          id;
          name = updatedProfile.name;
          description = updatedProfile.description;
          category = updatedProfile.category;
          shape = updatedProfile.shape;
          size = updatedProfile.size;
          image = switch (image) {
            case (?newImage) { newImage };
            case (null) { existing.image };
          };
        };
        ocarinaProfiles.add(id, newProfile);
      };
      case (null) { Runtime.trap("Ocarina profile not found") };
    };
  };

  public shared ({ caller }) func deleteOcarinaProfile(id : Text, password : Text) : async () {
    if (password.trim(#char(' ')) != creatorPasswordHash) {
      Runtime.trap("Invalid creator password");
    };

    if (ocarinaProfiles.containsKey(id)) {
      ocarinaProfiles.remove(id);
    } else {
      Runtime.trap("Ocarina profile not found");
    };
  };
};
