import unittest
import server

class UnitTests(unittest.TestCase):

	def setUp(self):
		server.clear_memory('team1', '123123')

	def test_can_read_team_activity_when_only_one_user(self):
		server.update_user_activity_('team1','user1','{"whatever":1}')
		result = server.get_team_activity('team1')
		self.assertEqual(result['user1'], {'whatever':1})

	def test_do_not_overwrite_activity_when_is_older_than_current(self):
		server.update_user_activity_('team1','user1','{"id": 997036378270}')
		server.update_user_activity_('team1','user1','{"id": 997036378210}')
		result = server.get_team_activity('team1')
		self.assertEqual(result['user1'], {'id': 997036378270})		

	def test_retrieve_team_activity_when_no_team(self):
		result = server.get_team_activity('lalala')
		self.assertEqual(result, {})

