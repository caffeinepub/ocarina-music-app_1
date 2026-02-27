import Map "mo:core/Map";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";

module {
  type Score = {
    name : Text;
    notes : [{
      pitch : Text;
      duration : Nat;
      fingering : [Text];
    }];
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

  type OldActor = {
    scores : Map.Map<Text, Score>;
    presetSongs : Map.Map<Text, PresetSong>;
    customSamples : Map.Map<Text, Storage.ExternalBlob>;
  };

  type NewActor = OldActor and {
    fingeringMap : Map.Map<Text, [Bool]>;
  };

  public func run(old : OldActor) : NewActor {
    let defaultFingeringMap = Map.fromArray([
      ("C5", [true, true, true, true]),
      ("D5", [true, true, true, false]),
      ("E5", [true, true, false, false]),
      ("F5", [true, false, false, false]),
      ("G5", [false, false, false, false]),
      ("A5", [false, false, true, true]),
      ("B5", [false, true, true, true]),
      ("C6", [false, false, false, false]),
    ]);
    { old with fingeringMap = defaultFingeringMap };
  };
};
