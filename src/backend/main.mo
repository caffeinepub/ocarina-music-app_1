import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import Storage "blob-storage/Storage";
import OutCall "http-outcalls/outcall";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let creatorPasswordHash = "MTk5NjIwMjY=";

  type HoleConfig = {
    id : Text;
    x : Nat;
    y : Nat;
    size : Nat;
    note : Text;
  };

  type ScaleMode = {
    #diatonic;
    #chromatic;
  };

  type Note = {
    pitch : Text;
    duration : Nat;
    fingering : [Text];
  };

  type Score = {
    name : Text;
    notes : [Note];
    lyrics : ?Text;
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
    holeConfigs : [HoleConfig];
    scaleMode : ScaleMode;
    octave : Nat;
  };

  public type OcarinaProfileForm = {
    name : Text;
    description : Text;
    category : Text;
    shape : Text;
    size : SizePreset;
    holeConfigs : [HoleConfig];
    scaleMode : ScaleMode;
    octave : Nat;
  };

  public type HolePreset = {
    id : Text;
    name : Text;
    holeConfigs : [HoleConfig];
    scaleMode : ScaleMode;
    octave : Nat;
  };

  public type HolePresetForm = {
    name : Text;
    holeConfigs : [HoleConfig];
    scaleMode : ScaleMode;
    octave : Nat;
  };

  public type UserProfile = {
    name : Text;
    favoriteScores : [Text];
  };

  let scores = Map.empty<Text, Score>();
  let presetSongs = Map.empty<Text, PresetSong>();
  let customSamples = Map.empty<Text, Storage.ExternalBlob>();
  let fingeringMap = Map.empty<Text, [Bool]>();
  let ocarinaProfiles = Map.empty<Text, OcarinaProfile>();
  let holePresets = Map.empty<Text, HolePreset>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Score management - requires user role
  public shared ({ caller }) func saveScore(name : Text, score : Score) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save scores");
    };
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

  public shared ({ caller }) func deleteScore(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete scores");
    };
    if (scores.containsKey(name)) {
      scores.remove(name);
    } else {
      Runtime.trap("Score not found");
    };
  };

  // Sample management - requires user role
  public shared ({ caller }) func uploadSample(note : Text, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload samples");
    };
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

  public shared ({ caller }) func deleteSampleAssignment(note : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sample assignments");
    };
    if (customSamples.containsKey(note)) {
      customSamples.remove(note);
    } else {
      Runtime.trap("Sample assignment not found");
    };
  };

  // Preset songs - admin only for adding
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add preset songs");
    };
    let song = {
      id;
      displayName;
      score;
    };
    presetSongs.add(id, song);
  };

  // Fingering map - requires user role
  public shared ({ caller }) func saveFingeringMap(newMap : [(Text, [Bool])]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save fingering maps");
    };
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

  // Ocarina profiles - public read, admin write
  public query ({ caller }) func getOcarinaProfiles() : async [OcarinaProfile] {
    ocarinaProfiles.values().toArray();
  };

  public query ({ caller }) func getOcarinaProfile(id : Text) : async OcarinaProfile {
    switch (ocarinaProfiles.get(id)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("Ocarina profile not found") };
    };
  };

  public shared ({ caller }) func createOcarinaProfile(id : Text, profileData : OcarinaProfileForm, image : Storage.ExternalBlob, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create ocarina profiles");
    };

    let profile = {
      id;
      name = profileData.name;
      description = profileData.description;
      category = profileData.category;
      shape = profileData.shape;
      size = profileData.size;
      image;
      holeConfigs = profileData.holeConfigs;
      scaleMode = profileData.scaleMode;
      octave = profileData.octave;
    };

    ocarinaProfiles.add(id, profile);
  };

  public shared ({ caller }) func bulkCreateOcarinaProfiles(
    entries : [(Text, OcarinaProfileForm, Storage.ExternalBlob)],
    password : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can bulk create ocarina profiles");
    };

    for ((id, profileData, image) in entries.values()) {
      let profile = {
        id;
        name = profileData.name;
        description = profileData.description;
        category = profileData.category;
        shape = profileData.shape;
        size = profileData.size;
        image;
        holeConfigs = profileData.holeConfigs;
        scaleMode = profileData.scaleMode;
        octave = profileData.octave;
      };

      ocarinaProfiles.add(id, profile);
    };
  };

  public shared ({ caller }) func updateOcarinaProfile(id : Text, updatedProfile : OcarinaProfileForm, image : ?Storage.ExternalBlob, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update ocarina profiles");
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
          holeConfigs = updatedProfile.holeConfigs;
          scaleMode = updatedProfile.scaleMode;
          octave = updatedProfile.octave;
        };
        ocarinaProfiles.add(id, newProfile);
      };
      case (null) { Runtime.trap("Ocarina profile not found") };
    };
  };

  public shared ({ caller }) func deleteOcarinaProfile(id : Text, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete ocarina profiles");
    };

    if (ocarinaProfiles.containsKey(id)) {
      ocarinaProfiles.remove(id);
    } else {
      Runtime.trap("Ocarina profile not found");
    };
  };

  // Hole presets - public read, admin write
  public query ({ caller }) func getHolePresets() : async [HolePreset] {
    holePresets.values().toArray();
  };

  public shared ({ caller }) func saveHolePreset(preset : HolePresetForm, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can save hole presets");
    };

    let id = preset.name.trim(#char(' '));
    let newPreset : HolePreset = {
      id;
      name = preset.name;
      holeConfigs = preset.holeConfigs;
      scaleMode = preset.scaleMode;
      octave = preset.octave;
    };

    holePresets.add(id, newPreset);
  };

  public shared ({ caller }) func deleteHolePreset(id : Text, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete hole presets");
    };

    if (holePresets.containsKey(id)) {
      holePresets.remove(id);
    } else {
      Runtime.trap("Hole preset not found");
    };
  };

  // Stripe related functions
  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared func setStripeConfiguration(config : Stripe.StripeConfiguration, password : Text) : async () {
    if (password != "19962026") {
      Runtime.trap("Unauthorized: Incorrect admin password");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be configured first") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
